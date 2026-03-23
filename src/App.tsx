import React, { useState, useEffect } from 'react';
import { 
  auth, 
  db, 
  googleProvider, 
  handleFirestoreError, 
  OperationType 
} from './firebase';
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  doc, 
  setDoc, 
  getDocs,
  updateDoc
} from 'firebase/firestore';
import { 
  Music, 
  Sun, 
  Calendar, 
  MapPin, 
  Package, 
  LogOut, 
  LogIn, 
  CheckCircle, 
  Clock, 
  XCircle,
  Plus,
  Trash2,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster, toast } from 'sonner';
import { format, addDays, isWithinInterval, eachDayOfInterval, startOfDay } from 'date-fns';
import DatePicker, { registerLocale } from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { ptBR } from 'date-fns/locale/pt-BR';

registerLocale('pt-BR', ptBR);

// Types
interface Equipment {
  id: string;
  name: string;
  category: 'Sound' | 'Light' | 'Cables' | 'Microphones';
  description: string;
  pricePerDay: number;
  imageUrl: string;
}

interface Booking {
  id: string;
  clientUid: string;
  clientEmail: string;
  clientName: string;
  startDate: string;
  endDate: string;
  location: string;
  eventType: string;
  packageType: string;
  items: { id: string; name: string; price: number }[];
  status: 'pending' | 'confirmed' | 'cancelled';
  totalPrice: number;
  createdAt: string;
}

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'client';
  createdAt: string;
}

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<string>('Personalizado');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [cart, setCart] = useState<Equipment[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);

  // Form State
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(addDays(new Date(), 1));
  const [location, setLocation] = useState('');
  const [cep, setCep] = useState('');
  const [eventType, setEventType] = useState('Festa');
  const [isValidatingLocation, setIsValidatingLocation] = useState(false);
  const [locationVerified, setLocationVerified] = useState(false);

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setCep(value);

    if (value.length === 8) {
      setIsValidatingLocation(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${value}/json/`);
        const data = await response.json();

        if (data.erro) {
          toast.error('CEP não encontrado.');
          setLocationVerified(false);
        } else {
          const fullAddress = `${data.logradouro}, ${data.bairro}, ${data.localidade} - ${data.uf}`;
          setLocation(fullAddress);
          setLocationVerified(true);
          toast.success('Endereço localizado!');
        }
      } catch (error) {
        toast.error('Erro ao buscar CEP.');
      } finally {
        setIsValidatingLocation(false);
      }
    }
  };

  const toggleCart = (item: Equipment) => {
    if (cart.find(i => i.id === item.id)) {
      setCart(cart.filter(i => i.id !== item.id));
      toast.info(`${item.name} removido do carrinho`);
    } else {
      setCart([...cart, item]);
      toast.success(`${item.name} adicionado ao carrinho!`);
    }
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const cartTotal = cart.reduce((acc, item) => acc + item.pricePerDay, 0);

  const getUnavailableDates = () => {
    const unavailableSet = new Set<string>();
    const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
    
    // For each item in cart, find dates where it's already booked
    cart.forEach(cartItem => {
      confirmedBookings.forEach(booking => {
        const hasItem = booking.items.some(i => i.id === cartItem.id);
        if (hasItem) {
          const start = startOfDay(new Date(booking.startDate));
          const end = startOfDay(new Date(booking.endDate));
          const days = eachDayOfInterval({ start, end });
          days.forEach(day => unavailableSet.add(day.toISOString()));
        }
      });
    });
    
    return Array.from(unavailableSet).map(d => new Date(d));
  };

  const unavailableDates = getUnavailableDates();

  const isDateUnavailable = (date: Date) => {
    const dayStr = startOfDay(date).toISOString();
    return unavailableDates.some(d => startOfDay(d).toISOString() === dayStr);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Fetch or create profile
        const userDoc = doc(db, 'users', firebaseUser.uid);
        try {
          const docSnap = await getDocs(query(collection(db, 'users'), where('uid', '==', firebaseUser.uid)));
          if (docSnap.empty) {
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || 'Usuário',
              role: firebaseUser.email === 'thiagohabibmonteiroster@gmail.com' ? 'admin' : 'client',
              createdAt: new Date().toISOString()
            };
            await setDoc(userDoc, newProfile);
            setProfile(newProfile);
          } else {
            const data = docSnap.docs[0].data() as UserProfile;
            setProfile(data);
            setIsAdmin(data.role === 'admin');
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, 'users');
        }
      } else {
        setProfile(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Equipment listener
    const q = query(collection(db, 'equipment'), orderBy('name'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Equipment));
      setEquipment(items);
      
      // Seed initial data if empty
      if (items.length === 0 && isAdmin) {
        seedInitialEquipment();
      }
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'equipment'));

    return () => unsubscribe();
  }, [isAdmin]);

  useEffect(() => {
    if (!user) return;
    // Bookings listener
    const q = isAdmin 
      ? query(collection(db, 'bookings'), orderBy('createdAt', 'desc'))
      : query(collection(db, 'bookings'), where('clientUid', '==', user.uid), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
      setBookings(items);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'bookings'));

    return () => unsubscribe();
  }, [user, isAdmin]);

  const seedInitialEquipment = async () => {
    const initial = [
      { name: 'Caixa de Som Ativa 15"', category: 'Sound', pricePerDay: 150, description: 'Potente e clara para eventos médios e grandes.' },
      { name: 'Refletor LED Par 64 RGBW', category: 'Light', pricePerDay: 50, description: 'Iluminação colorida para palcos e decoração de ambientes.' },
      { name: 'Microfone Sem Fio Shure QLXD', category: 'Microphones', pricePerDay: 85, description: 'Qualidade profissional digital para cerimônias e palestras.' },
      { name: 'Luz Estroboscópica 1500W', category: 'Light', pricePerDay: 70, description: 'Efeito flash de alta intensidade para pistas de dança.' },
      { name: 'Mesa de Som Digital 16 Canais', category: 'Sound', pricePerDay: 180, description: 'Mixagem profissional com efeitos integrados e controle via tablet.' },
      { name: 'Subwoofer Ativo 18" 1000W', category: 'Sound', pricePerDay: 200, description: 'Graves profundos para festas e shows de grande porte.' },
      { name: 'Máquina de Fumaça 1200W', category: 'Light', pricePerDay: 60, description: 'Realça os feixes de luz e cria atmosfera no evento.' },
      { name: 'Kit de Cabos XLR/P10 (10m)', category: 'Cables', pricePerDay: 30, description: 'Conjunto de cabos blindados para conexão de todo o sistema.' },
      { name: 'Pedestal para Microfone Girafa', category: 'Microphones', pricePerDay: 20, description: 'Suporte robusto e ajustável para qualquer tipo de uso.' },
      { name: 'Moving Head Beam 7R', category: 'Light', pricePerDay: 150, description: 'Canhão de luz móvel com diversos globos e cores para efeitos dinâmicos.' },
    ];

    for (const item of initial) {
      await addDoc(collection(db, 'equipment'), {
        ...item,
        imageUrl: `https://picsum.photos/seed/${encodeURIComponent(item.name)}/400/300`
      });
    }
  };

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success('Login realizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao fazer login.');
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    toast.info('Você saiu da conta.');
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !startDate || !endDate || cart.length === 0) {
      if (cart.length === 0) toast.error('Selecione ao menos um equipamento!');
      return;
    }

    if (!locationVerified) {
      toast.error('Por favor, verifique o endereço antes de confirmar.');
      return;
    }

    // Check if any date in range is unavailable
    const range = eachDayOfInterval({ start: startOfDay(startDate), end: startOfDay(endDate) });
    const hasUnavailableDate = range.some(date => isDateUnavailable(date));

    if (hasUnavailableDate) {
      toast.error('Alguns itens não estão disponíveis nas datas selecionadas.');
      return;
    }

    const newBooking: Omit<Booking, 'id'> = {
      clientUid: user.uid,
      clientEmail: user.email || '',
      clientName: user.displayName || 'Cliente',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      location,
      eventType,
      packageType: selectedPackage,
      items: cart.map(i => ({ id: i.id, name: i.name, price: i.pricePerDay })),
      status: 'pending',
      totalPrice: cartTotal,
      createdAt: new Date().toISOString()
    };

    try {
      const docRef = await addDoc(collection(db, 'bookings'), newBooking);
      setShowBookingModal(false);
      setCart([]);
      toast.success('Pedido de aluguel enviado com sucesso!');
      
      // Notify server
      fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking: { ...newBooking, id: docRef.id }, type: 'new' })
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'bookings');
    }
  };

  const updateBookingStatus = async (id: string, status: 'confirmed' | 'cancelled') => {
    try {
      const bookingRef = doc(db, 'bookings', id);
      await updateDoc(bookingRef, { status });
      toast.success(`Reserva ${status === 'confirmed' ? 'confirmada' : 'cancelada'}.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'bookings');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white font-sans">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Music size={48} className="text-orange-500" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-orange-500/30">
      <Toaster position="top-center" richColors />
      
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="bg-orange-500 p-1.5 rounded-lg">
                <Music className="text-black" size={20} />
              </div>
              <span className="text-xl font-bold tracking-tighter uppercase">Som & Luz</span>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#catalog" className="text-sm font-medium hover:text-orange-500 transition-colors">Equipamentos</a>
              {user && (
                <a href="#my-bookings" className="text-sm font-medium hover:text-orange-500 transition-colors">Minhas Reservas</a>
              )}
              {isAdmin && (
                <a href="#admin" className="text-sm font-medium text-orange-500">Painel Admin</a>
              )}
              <div className="flex items-center gap-4">
                {cart.length > 0 && (
                  <button 
                    onClick={() => setShowBookingModal(true)}
                    className="relative p-2 bg-orange-500 text-black rounded-full hover:scale-110 transition-transform"
                  >
                    <Package size={20} />
                    <span className="absolute -top-1 -right-1 bg-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-orange-500">
                      {cart.length}
                    </span>
                  </button>
                )}
                {user ? (
                  <>
                    <span className="text-xs text-zinc-400">{user.displayName}</span>
                    <button onClick={handleLogout} className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
                      <LogOut size={18} />
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={handleLogin}
                    className="bg-white text-black px-4 py-2 rounded-full text-sm font-bold hover:bg-orange-500 hover:text-white transition-all flex items-center gap-2"
                  >
                    <LogIn size={16} /> Entrar
                  </button>
                )}
              </div>
            </div>

            <div className="md:hidden">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2">
                {isMenuOpen ? <X /> : <Menu />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden bg-zinc-900 border-b border-zinc-800 p-4 space-y-4"
          >
            <a href="#catalog" className="block text-lg font-medium">Equipamentos</a>
            {user && <a href="#my-bookings" className="block text-lg font-medium">Minhas Reservas</a>}
            {user ? (
              <button onClick={handleLogout} className="w-full text-left text-red-400 font-medium">Sair</button>
            ) : (
              <button onClick={handleLogin} className="w-full bg-white text-black py-3 rounded-xl font-bold">Entrar com Google</button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <header className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-orange-500/10 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-6"
          >
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase leading-[0.9]">
              Som <span className="text-orange-500">Puro</span><br />
              Luz <span className="text-orange-500">Vibrante</span>
            </h1>
            <p className="max-w-2xl mx-auto text-zinc-400 text-lg">
              Aluguel de equipamentos profissionais para festas, cerimônias e eventos de todos os portes. 
              Qualidade garantida para o seu momento especial.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button 
                onClick={() => user ? setShowBookingModal(true) : handleLogin()}
                className="bg-orange-500 text-black px-8 py-4 rounded-full font-black uppercase tracking-widest hover:scale-105 transition-transform"
              >
                Reservar Agora
              </button>
              <a 
                href="#catalog"
                className="border border-zinc-700 px-8 py-4 rounded-full font-black uppercase tracking-widest hover:bg-zinc-800 transition-colors"
              >
                Ver Catálogo
              </a>
            </div>
          </motion.div>
        </div>
      </header>

      {/* Catalog Section */}
      <section id="catalog" className="py-24 bg-zinc-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-3xl font-black uppercase tracking-tighter">Equipamentos</h2>
              <p className="text-zinc-500">O melhor do som e iluminação profissional</p>
            </div>
            <div className="hidden sm:flex gap-2">
              {['Tudo', 'Sound', 'Light', 'Microphones'].map(cat => (
                <button key={cat} className="px-4 py-1.5 rounded-full text-xs font-bold border border-zinc-800 hover:border-orange-500 transition-colors">
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {equipment.map((item, idx) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="group bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden hover:border-orange-500/50 transition-all flex flex-col"
              >
                <div 
                  onClick={() => setSelectedEquipment(item)}
                  className="aspect-square relative overflow-hidden cursor-pointer"
                >
                  <img 
                    src={item.imageUrl} 
                    alt={item.name}
                    className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-2 left-2">
                    <span className="bg-black/50 backdrop-blur-md px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest">
                      {item.category}
                    </span>
                  </div>
                </div>
                <div className="p-3 md:p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div 
                    onClick={() => setSelectedEquipment(item)}
                    className="space-y-1 cursor-pointer"
                  >
                    <h3 className="text-sm md:text-base font-bold leading-tight line-clamp-1">{item.name}</h3>
                    <p className="text-orange-500 font-black text-sm">R$ {item.pricePerDay}</p>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCart(item);
                    }}
                    className={`w-full py-2 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2 ${
                      cart.find(i => i.id === item.id) 
                      ? 'bg-orange-500 text-black' 
                      : 'bg-zinc-900 hover:bg-zinc-800'
                    }`}
                  >
                    {cart.find(i => i.id === item.id) ? (
                      <><CheckCircle size={14} /> No Carrinho</>
                    ) : (
                      <><Plus size={14} /> Adicionar</>
                    )}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Admin / My Bookings Section */}
      <section id="my-bookings" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <h2 className="text-3xl font-black uppercase tracking-tighter">
              {isAdmin ? 'Gestão de Reservas' : 'Minhas Reservas'}
            </h2>
            <p className="text-zinc-500">Acompanhe o status dos seus pedidos</p>
          </div>

          <div className="space-y-4">
            {bookings.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed border-zinc-800 rounded-3xl">
                <Calendar className="mx-auto text-zinc-700 mb-4" size={48} />
                <p className="text-zinc-500">Nenhuma reserva encontrada.</p>
              </div>
            ) : (
              bookings.map((booking) => (
                <div key={booking.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${
                        booking.status === 'confirmed' ? 'bg-green-500' : 
                        booking.status === 'cancelled' ? 'bg-red-500' : 'bg-orange-500'
                      }`} />
                      <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                        {booking.status === 'confirmed' ? 'Confirmado' : 
                         booking.status === 'cancelled' ? 'Cancelado' : 'Pendente'}
                      </span>
                    </div>
                    <h4 className="text-lg font-bold">{booking.packageType} - {booking.eventType}</h4>
                    <div className="flex flex-wrap gap-4 text-sm text-zinc-500">
                      <div className="flex items-center gap-1.5"><Calendar size={14} /> {format(new Date(booking.startDate), 'dd/MM/yy')}</div>
                      <div className="flex items-center gap-1.5"><MapPin size={14} /> {booking.location}</div>
                      {isAdmin && <div className="flex items-center gap-1.5"><Package size={14} /> {booking.clientName}</div>}
                    </div>
                    {booking.items && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {booking.items.map((item, i) => (
                          <span key={i} className="text-[10px] bg-zinc-800 px-2 py-0.5 rounded-md border border-zinc-700">
                            {item.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-zinc-500 uppercase font-bold">Total</p>
                      <p className="text-xl font-black text-orange-500">R$ {booking.totalPrice}</p>
                    </div>
                    {isAdmin && booking.status === 'pending' && (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                          className="p-2 bg-green-500/10 text-green-500 rounded-xl hover:bg-green-500 hover:text-black transition-colors"
                        >
                          <CheckCircle size={20} />
                        </button>
                        <button 
                          onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                          className="p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-black transition-colors"
                        >
                          <XCircle size={20} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Booking Modal */}
      <AnimatePresence>
        {showBookingModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBookingModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-zinc-900 border border-zinc-800 rounded-[2rem] w-full max-w-xl overflow-hidden shadow-2xl"
            >
              <div className="p-8 space-y-8">
                <div className="flex justify-between items-center">
                  <h2 className="text-3xl font-black uppercase tracking-tighter">Nova Reserva</h2>
                  <button onClick={() => setShowBookingModal(false)} className="p-2 hover:bg-zinc-800 rounded-full">
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleBooking} className="space-y-6">
                  {/* Cart Summary in Modal */}
                  <div className="bg-zinc-950/50 border border-zinc-800/50 rounded-2xl p-5 space-y-3">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Itens Selecionados</p>
                    </div>
                    <div className="space-y-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                      {cart.map(item => (
                        <div key={item.id} className="flex justify-between items-center text-sm group">
                          <span className="text-zinc-300 font-medium truncate pr-4">{item.name}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-orange-500 font-bold whitespace-nowrap">R$ {item.pricePerDay}</span>
                            <button type="button" onClick={() => removeFromCart(item.id)} className="text-zinc-600 hover:text-red-500 transition-colors">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="pt-3 border-t border-zinc-800/50 flex justify-between items-center font-black">
                      <span className="text-zinc-100 uppercase tracking-tighter">Total Diária</span>
                      <span className="text-orange-500 text-lg">R$ {cartTotal}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Início</label>
                      <div className="relative">
                        <DatePicker
                          selected={startDate}
                          onChange={(date) => setStartDate(date)}
                          selectsStart
                          startDate={startDate}
                          endDate={endDate}
                          minDate={new Date()}
                          locale="pt-BR"
                          dayClassName={date => isDateUnavailable(date) ? "text-red-500 font-bold !bg-red-500/10" : undefined}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-4 focus:outline-none focus:border-orange-500 text-sm font-bold tracking-tight"
                          dateFormat="dd/MM/yyyy"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Fim</label>
                      <div className="relative">
                        <DatePicker
                          selected={endDate}
                          onChange={(date) => setEndDate(date)}
                          selectsEnd
                          startDate={startDate}
                          endDate={endDate}
                          minDate={startDate || new Date()}
                          locale="pt-BR"
                          dayClassName={date => isDateUnavailable(date) ? "text-red-500 font-bold !bg-red-500/10" : undefined}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-4 focus:outline-none focus:border-orange-500 text-sm font-bold tracking-tight"
                          dateFormat="dd/MM/yyyy"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">CEP</label>
                      <div className="relative">
                        <input 
                          value={cep}
                          onChange={handleCepChange}
                          maxLength={8}
                          placeholder="00000000"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-4 focus:outline-none focus:border-orange-500 text-sm font-bold tracking-tight"
                        />
                        {isValidatingLocation && (
                          <motion.div 
                            animate={{ rotate: 360 }} 
                            transition={{ repeat: Infinity, duration: 1 }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-orange-500"
                          >
                            <Clock size={14} />
                          </motion.div>
                        )}
                      </div>
                    </div>
                    <div className="col-span-2 space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Local do Evento (Rua, Nº, Compl.)</label>
                      <div className="relative">
                        <MapPin className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${locationVerified ? 'text-green-500' : 'text-zinc-600'}`} size={18} />
                        <input 
                          required
                          value={location}
                          onChange={(e) => {
                            setLocation(e.target.value);
                            // If they manually edit, we still trust the CEP was valid if they don't clear it
                            if (!e.target.value) setLocationVerified(false);
                          }}
                          placeholder="Digite o endereço completo"
                          className={`w-full bg-zinc-950 border rounded-2xl pl-12 pr-4 py-4 focus:outline-none transition-all text-sm font-medium ${
                            locationVerified ? 'border-green-500/50 focus:border-green-500' : 'border-zinc-800 focus:border-orange-500'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                  {locationVerified && (
                    <p className="text-[10px] text-green-500 font-bold flex items-center gap-1">
                      <CheckCircle size={10} /> Endereço validado via CEP
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Tipo de Evento</label>
                      <select 
                        value={eventType}
                        onChange={(e) => setEventType(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-4 focus:outline-none focus:border-orange-500 appearance-none text-sm font-medium"
                      >
                        {['Festa', 'Cerimonia', 'Pequena', 'Grande', 'Medio Porte'].map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Pacote</label>
                      <select 
                        value={selectedPackage}
                        onChange={(e) => setSelectedPackage(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-4 focus:outline-none focus:border-orange-500 appearance-none text-sm font-medium"
                      >
                        {['só Luz', 'Luz + Som', 'Personalizado'].map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-orange-500 text-black py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-orange-400 transition-all active:scale-[0.98] shadow-lg shadow-orange-500/20"
                  >
                    Confirmar Pedido
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Product Detail Modal */}
      <AnimatePresence>
        {selectedEquipment && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedEquipment(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-zinc-900 border border-zinc-800 rounded-[2.5rem] w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col md:flex-row"
            >
              <div className="w-full md:w-1/2 aspect-square md:aspect-auto relative bg-black">
                <img 
                  src={selectedEquipment.imageUrl} 
                  alt={selectedEquipment.name}
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-6 left-6">
                  <span className="bg-orange-500 text-black px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest">
                    {selectedEquipment.category}
                  </span>
                </div>
              </div>
              <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-between space-y-8">
                <div className="space-y-6">
                  <div className="flex justify-between items-start">
                    <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter leading-none">
                      {selectedEquipment.name}
                    </h2>
                    <button onClick={() => setSelectedEquipment(null)} className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
                      <X size={24} />
                    </button>
                  </div>
                  <div className="space-y-4">
                    <p className="text-orange-500 text-2xl font-black">R$ {selectedEquipment.pricePerDay} <span className="text-zinc-500 text-sm font-normal">/ dia</span></p>
                    <div className="h-px bg-zinc-800 w-full" />
                    <p className="text-zinc-400 leading-relaxed">
                      {selectedEquipment.description}
                    </p>
                    <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Especificações</p>
                      <ul className="text-sm text-zinc-300 space-y-1 list-disc list-inside">
                        <li>Equipamento profissional revisado</li>
                        <li>Garantia de funcionamento</li>
                        <li>Suporte técnico incluso</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => {
                      toggleCart(selectedEquipment);
                      setSelectedEquipment(null);
                    }}
                    className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest transition-all ${
                      cart.find(i => i.id === selectedEquipment.id)
                      ? 'bg-zinc-800 text-white border border-zinc-700'
                      : 'bg-orange-500 text-black hover:scale-[1.02]'
                    }`}
                  >
                    {cart.find(i => i.id === selectedEquipment.id) ? 'Remover do Carrinho' : 'Adicionar ao Carrinho'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="py-12 border-t border-zinc-800 mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="bg-zinc-800 p-1.5 rounded-lg">
              <Music className="text-orange-500" size={20} />
            </div>
            <span className="text-xl font-bold tracking-tighter uppercase">Som & Luz</span>
          </div>
          <p className="text-zinc-600 text-sm">© 2026 Som & Luz Equipamentos Profissionais. Todos os direitos reservados.</p>
          <div className="flex gap-6">
            <a href="#" className="text-zinc-500 hover:text-white transition-colors">Instagram</a>
            <a href="#" className="text-zinc-500 hover:text-white transition-colors">WhatsApp</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
