import { useEffect, useState } from 'react';
import {
  ArrowRight,
  CheckCircle,
  ChevronRight,
  Clock,
  Mail,
  MapPin,
  Menu,
  PartyPopper,
  Phone,
  Shield,
  Star,
  Users,
  Volume2,
  X,
  Zap,
} from 'lucide-react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from './firebase';

interface Equipment {
  id: string;
  name: string;
  category: 'Sound' | 'Light' | 'Cables' | 'Microphones';
  description: string;
  pricePerDay: number;
  imageUrl: string;
}

const WHATSAPP_PHONE = import.meta.env.VITE_WHATSAPP_PHONE || '5521996341398';
const WHATSAPP_DISPLAY = '(21) 99634-1398';
const WHATSAPP_MESSAGE = 'Olá! Vim pelo site e gostaria de pedir um orçamento para aluguel de som e luz.';
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

const JBL_MAX_15_IMAGE = new URL(
  '../imagens/Caixa de Som Ativa JBL MAX 15 com Bluetooth e Woofer de 15/D_NQ_NP_2X_647293-MLA99998222149_112025-F.webp',
  import.meta.url
).href;
const FBT_112A_IMAGE = new URL(
  '../imagens/Alto-falante Fbt X-lite 12a Com Bluetooth Black 100v240v/D_NQ_NP_2X_691433-MLB97837649161_112025-F.webp',
  import.meta.url
).href;
const SELENIUM_SPM_IMAGE = new URL(
  '../imagens/Caixa De Som Ativa Jbl Selenium Spm-1503a (Usado)/D_NQ_NP_2X_706664-MLB103864028495_012026-F.webp',
  import.meta.url
).href;

const featuredCatalog: Equipment[] = [
  {
    id: 'catalog-jbl-max-15',
    name: 'CAIXA ATIVA JBL MAX 15 (par)',
    category: 'Sound',
    pricePerDay: 250,
    description: 'Par de caixas ativas JBL para retirada, com alto rendimento e ótima presença para eventos.',
    imageUrl: JBL_MAX_15_IMAGE,
  },
  {
    id: 'catalog-fbt-112a',
    name: 'CAIXA ATIVA FBT 112A (par)',
    category: 'Sound',
    pricePerDay: 300,
    description: 'Par de caixas ativas FBT 112A com resposta forte e limpa para festas, cerimônias e locações.',
    imageUrl: FBT_112A_IMAGE,
  },
  {
    id: 'catalog-selenium-spm',
    name: 'CAIXA SELENIUM SPM 1502 (ativa + passiva)',
    category: 'Sound',
    pricePerDay: 200,
    description: 'Conjunto Selenium ativo + passivo com valor base para retirada.',
    imageUrl: SELENIUM_SPM_IMAGE,
  },
  {
    id: 'catalog-sub-15',
    name: 'SUB ATIVO + PASSIVO 15"',
    category: 'Sound',
    pricePerDay: 350,
    description: 'Kit com sub ativo e passivo de 15 polegadas para reforço de graves. Frete combinado à parte.',
    imageUrl: 'https://picsum.photos/seed/sub-ativo-passivo-15/800/800',
  },
];

const imageByName = Object.fromEntries(featuredCatalog.map(item => [item.name, item.imageUrl]));
const featuredNames = featuredCatalog.map(item => item.name);

const events = [
  { icon: PartyPopper, title: 'Festas', description: 'Aniversários, formaturas e confraternizações com som forte e montagem limpa.' },
  { icon: Users, title: 'Eventos Sociais', description: 'Estrutura prática para cerimônias, encontros e comemorações familiares.' },
  { icon: Zap, title: 'Ações e Locações', description: 'Retirada rápida e configuração objetiva para demandas pontuais.' },
  { icon: Shield, title: 'Uso Profissional', description: 'Equipamentos revisados para quem precisa de previsibilidade e desempenho.' },
];

const advantages = [
  { icon: CheckCircle, title: 'Equipamentos revisados', description: 'Tudo conferido antes da retirada ou entrega.' },
  { icon: Clock, title: 'Atendimento direto', description: 'Resposta rápida para orçamento e disponibilidade.' },
  { icon: Shield, title: 'Valores transparentes', description: 'Preço base de retirada, com frete combinado à parte.' },
  { icon: Star, title: 'Curadoria enxuta', description: 'Só os modelos principais que realmente fazem sentido para locação.' },
];

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    eventType: '',
    message: '',
  });

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'equipment'), orderBy('name'));
    const unsubscribe = onSnapshot(q, snapshot => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Equipment));
      setEquipment(items);
    });

    return () => unsubscribe();
  }, []);

  const displayedEquipment = (() => {
    const matched = equipment
      .filter(item => featuredNames.includes(item.name))
      .map(item => ({
        ...item,
        imageUrl: imageByName[item.name] || item.imageUrl,
      }));

    if (matched.length > 0) return matched;
    return featuredCatalog;
  })();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const message = [
      'Olá! Quero solicitar um orçamento.',
      `Nome: ${formData.name}`,
      `E-mail: ${formData.email}`,
      `Telefone: ${formData.phone}`,
      `Tipo de evento: ${formData.eventType || 'Não informado'}`,
      `Mensagem: ${formData.message || 'Sem detalhes adicionais.'}`,
    ].join('\n');

    window.open(
      `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  return (
    <div className="min-h-screen bg-dark-950 text-white">
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-dark-900/95 backdrop-blur-lg shadow-xl' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            <a href="#" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-brand-400 to-brand-600 rounded-lg flex items-center justify-center">
                <Volume2 className="w-6 h-6 text-dark-900" />
              </div>
              <span className="font-bold text-xl">
                Som<span className="text-brand-400">Luz</span>
              </span>
            </a>

            <div className="hidden md:flex items-center gap-8">
              <a href="#produtos" className="text-dark-300 hover:text-white transition-colors">Produtos</a>
              <a href="#eventos" className="text-dark-300 hover:text-white transition-colors">Eventos</a>
              <a href="#sobre" className="text-dark-300 hover:text-white transition-colors">Sobre</a>
              <a href="#contato" className="text-dark-300 hover:text-white transition-colors">Contato</a>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noreferrer"
                className="bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-dark-900 font-semibold px-6 py-2.5 rounded-lg transition-all"
              >
                Solicitar Orçamento
              </a>
            </div>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden text-white p-2"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden bg-dark-900/95 backdrop-blur-lg border-t border-dark-800">
            <div className="px-4 py-6 space-y-4">
              <a href="#produtos" className="block text-dark-300 hover:text-white transition-colors py-2" onClick={() => setIsMenuOpen(false)}>Produtos</a>
              <a href="#eventos" className="block text-dark-300 hover:text-white transition-colors py-2" onClick={() => setIsMenuOpen(false)}>Eventos</a>
              <a href="#sobre" className="block text-dark-300 hover:text-white transition-colors py-2" onClick={() => setIsMenuOpen(false)}>Sobre</a>
              <a href="#contato" className="block text-dark-300 hover:text-white transition-colors py-2" onClick={() => setIsMenuOpen(false)}>Contato</a>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noreferrer"
                className="block bg-gradient-to-r from-brand-500 to-brand-600 text-dark-900 font-semibold px-6 py-3 rounded-lg text-center"
                onClick={() => setIsMenuOpen(false)}
              >
                Solicitar Orçamento
              </a>
            </div>
          </div>
        )}
      </nav>

      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-brand-400/10 rounded-full blur-3xl animate-pulse-slow [animation-delay:1s]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-20">
          <div className="animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-dark-800/50 border border-dark-700 rounded-full px-4 py-2 mb-8">
              <Star className="w-4 h-4 text-brand-400" />
              <span className="text-sm text-dark-300">Catálogo direto, atendimento rápido e locação objetiva</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Aluguel de Equipamentos de
              <br />
              <span className="bg-gradient-to-r from-brand-400 via-brand-500 to-brand-300 bg-clip-text text-transparent">
                Som Profissional
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-dark-400 max-w-3xl mx-auto mb-10">
              Estrutura enxuta, modelos selecionados e preços claros para retirada.
              Frete, entrega e montagem combinados à parte conforme o evento.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noreferrer"
                className="group inline-flex items-center gap-2 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-dark-900 font-semibold px-8 py-4 rounded-xl transition-all shadow-lg shadow-brand-500/25"
              >
                Solicitar Orçamento
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <a
                href="#produtos"
                className="inline-flex items-center gap-2 bg-dark-800/50 hover:bg-dark-800 border border-dark-700 text-white font-medium px-8 py-4 rounded-xl transition-all"
              >
                Ver Produtos
              </a>
            </div>
          </div>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
            <div className="w-6 h-10 border-2 border-dark-600 rounded-full flex justify-center pt-2">
              <div className="w-1.5 h-3 bg-brand-400 rounded-full" />
            </div>
          </div>
        </div>
      </section>

      <section id="produtos" className="section-padding bg-dark-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block text-brand-400 font-semibold text-sm tracking-wider uppercase mb-4">
              Produtos Disponíveis
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              Os 4 modelos do <span className="gradient-text">catálogo atual</span>
            </h2>
            <p className="text-dark-400 max-w-2xl mx-auto">
              Valores base para retirada. Caso precise de entrega, montagem ou operação,
              o frete e a logística são combinados separadamente.
            </p>
          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
            {displayedEquipment.map(item => (
              <article
                key={item.id}
                className="group overflow-hidden rounded-2xl bg-gradient-to-br from-dark-800 to-dark-900 border border-dark-700 hover:border-brand-500/40 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="aspect-[4/4] overflow-hidden bg-dark-950">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-6">
                  <div className="inline-flex items-center rounded-full bg-brand-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-brand-400 mb-4">
                    {item.category}
                  </div>
                  <h3 className="text-lg font-semibold mb-3 min-h-[56px]">{item.name}</h3>
                  <p className="text-dark-400 text-sm leading-relaxed min-h-[72px]">{item.description}</p>
                  <div className="mt-6 pt-6 border-t border-dark-700 flex items-end justify-between gap-4">
                    <div>
                      <p className="text-dark-400 text-xs uppercase tracking-wider">Valor retirada</p>
                      <p className="text-2xl font-bold text-brand-400">R$ {item.pricePerDay}</p>
                    </div>
                    <a
                      href={`https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(`Olá! Quero orçamento para ${item.name}.`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-3 text-sm font-semibold text-dark-900 hover:bg-brand-400 transition-colors"
                    >
                      Pedir
                      <ChevronRight className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="eventos" className="section-padding bg-dark-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block text-brand-400 font-semibold text-sm tracking-wider uppercase mb-4">
              Tipos de Atendimento
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              Estrutura para <span className="gradient-text">diferentes cenários</span>
            </h2>
            <p className="text-dark-400 max-w-2xl mx-auto">
              O layout segue o modelo novo, mas o catálogo permanece alinhado aos produtos reais já definidos.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {events.map((item, index) => (
              <div
                key={index}
                className="relative group overflow-hidden rounded-2xl bg-gradient-to-br from-dark-800 to-dark-900 border border-dark-700 hover:border-brand-500/30 transition-all"
              >
                <div className="p-6">
                  <div className="w-12 h-12 bg-brand-500/10 rounded-lg flex items-center justify-center mb-4">
                    <item.icon className="w-6 h-6 text-brand-400" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  <p className="text-dark-400 text-sm">{item.description}</p>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-500 to-brand-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="sobre" className="section-padding bg-dark-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <span className="inline-block text-brand-400 font-semibold text-sm tracking-wider uppercase mb-4">
                Por que nos escolher
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
                Visual novo com operação <span className="gradient-text">objetiva</span>
              </h2>
              <p className="text-dark-400 mb-8 text-lg leading-relaxed">
                Mantive o número de WhatsApp atual e os produtos já definidos, mas trazendo o site
                para o layout mais profissional que você separou. A proposta continua simples:
                catálogo enxuto, preço claro e contato direto para orçamento.
              </p>

              <div className="grid sm:grid-cols-2 gap-4">
                {advantages.map((item, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-brand-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-4 h-4 text-brand-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm mb-1">{item.title}</h4>
                      <p className="text-dark-400 text-sm">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="aspect-square bg-gradient-to-br from-dark-800 to-dark-900 rounded-2xl border border-dark-700 overflow-hidden relative">
                <img
                  src={displayedEquipment[0]?.imageUrl || JBL_MAX_15_IMAGE}
                  alt="Equipamento profissional"
                  className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-transparent to-transparent" />

                <div className="absolute bottom-6 left-6 right-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-dark-900/80 backdrop-blur-lg rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-brand-400">4</div>
                      <div className="text-xs text-dark-400">Produtos</div>
                    </div>
                    <div className="bg-dark-900/80 backdrop-blur-lg rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-brand-400">100%</div>
                      <div className="text-xs text-dark-400">WhatsApp</div>
                    </div>
                    <div className="bg-dark-900/80 backdrop-blur-lg rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-brand-400">Base</div>
                      <div className="text-xs text-dark-400">Retirada</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -top-4 -right-4 w-24 h-24 bg-brand-500/20 rounded-2xl blur-xl" />
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-brand-400/10 rounded-2xl blur-xl" />
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.1),transparent_70%)]" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
            Pronto para fechar seu <span className="gradient-text">orçamento</span>?
          </h2>
          <p className="text-dark-400 text-lg mb-8 max-w-2xl mx-auto">
            Chama no WhatsApp e eu já deixo separado o modelo que você precisa, com frete combinado se for o caso.
          </p>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-dark-900 font-semibold px-8 py-4 rounded-xl transition-all shadow-lg shadow-brand-500/25"
          >
            Fale Conosco Agora
            <ChevronRight className="w-5 h-5" />
          </a>
        </div>
      </section>

      <section id="contato" className="section-padding bg-dark-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
            <div>
              <span className="inline-block text-brand-400 font-semibold text-sm tracking-wider uppercase mb-4">
                Entre em Contato
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                Vamos <span className="gradient-text">conversar</span>
              </h2>
              <p className="text-dark-400 mb-8">
                O contato principal continua sendo via WhatsApp, com orçamento direto e resposta mais rápida.
              </p>

              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-brand-500/10 rounded-xl flex items-center justify-center">
                    <Phone className="w-5 h-5 text-brand-400" />
                  </div>
                  <div>
                    <p className="text-dark-400 text-sm">Telefone / WhatsApp</p>
                    <p className="font-semibold">{WHATSAPP_DISPLAY}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-brand-500/10 rounded-xl flex items-center justify-center">
                    <Mail className="w-5 h-5 text-brand-400" />
                  </div>
                  <div>
                    <p className="text-dark-400 text-sm">Atendimento</p>
                    <p className="font-semibold">Orçamentos e dúvidas pelo WhatsApp</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-brand-500/10 rounded-xl flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-brand-400" />
                  </div>
                  <div>
                    <p className="text-dark-400 text-sm">Condição comercial</p>
                    <p className="font-semibold">Retirada como base. Frete sob consulta.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-dark-800/50 border border-dark-700 rounded-2xl p-6 sm:p-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium mb-2">Nome completo</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={event => setFormData({ ...formData, name: event.target.value })}
                    className="w-full bg-dark-900/50 border border-dark-600 rounded-xl px-4 py-3 text-white placeholder-dark-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                    placeholder="Seu nome"
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium mb-2">E-mail</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={event => setFormData({ ...formData, email: event.target.value })}
                      className="w-full bg-dark-900/50 border border-dark-600 rounded-xl px-4 py-3 text-white placeholder-dark-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                      placeholder="seu@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Telefone</label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={event => setFormData({ ...formData, phone: event.target.value })}
                      className="w-full bg-dark-900/50 border border-dark-600 rounded-xl px-4 py-3 text-white placeholder-dark-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                      placeholder={WHATSAPP_DISPLAY}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Tipo de evento</label>
                  <select
                    value={formData.eventType}
                    onChange={event => setFormData({ ...formData, eventType: event.target.value })}
                    className="w-full bg-dark-900/50 border border-dark-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                  >
                    <option value="" className="bg-dark-900">Selecione</option>
                    <option value="festa" className="bg-dark-900">Festa</option>
                    <option value="cerimonia" className="bg-dark-900">Cerimônia</option>
                    <option value="evento-social" className="bg-dark-900">Evento social</option>
                    <option value="locacao-direta" className="bg-dark-900">Locação direta</option>
                    <option value="outro" className="bg-dark-900">Outro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Mensagem</label>
                  <textarea
                    rows={4}
                    value={formData.message}
                    onChange={event => setFormData({ ...formData, message: event.target.value })}
                    className="w-full bg-dark-900/50 border border-dark-600 rounded-xl px-4 py-3 text-white placeholder-dark-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors resize-none"
                    placeholder="Conte quais produtos você precisa, data e se vai retirar ou pedir entrega."
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-dark-900 font-semibold py-4 rounded-xl transition-all shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  Enviar pelo WhatsApp
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-green-500 hover:bg-green-600 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl hover:shadow-green-500/30 transition-all duration-300 hover:scale-110 group"
        aria-label="Contato via WhatsApp"
      >
        <svg
          className="w-7 h-7 group-hover:scale-110 transition-transform"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554-.001 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
        <span className="absolute right-full mr-3 bg-dark-900 text-white text-sm px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg">
          Fale conosco!
        </span>
      </a>

      <footer className="bg-dark-950 border-t border-dark-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <a href="#" className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-brand-400 to-brand-600 rounded-lg flex items-center justify-center">
                  <Volume2 className="w-6 h-6 text-dark-900" />
                </div>
                <span className="font-bold text-xl">
                  Som<span className="text-brand-400">Luz</span>
                </span>
              </a>
              <p className="text-dark-400 max-w-md">
                Catálogo objetivo de som profissional para locação, com orçamento rápido e atendimento direto no WhatsApp.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Links Rápidos</h4>
              <ul className="space-y-2">
                <li><a href="#produtos" className="text-dark-400 hover:text-white transition-colors">Produtos</a></li>
                <li><a href="#eventos" className="text-dark-400 hover:text-white transition-colors">Eventos</a></li>
                <li><a href="#sobre" className="text-dark-400 hover:text-white transition-colors">Sobre</a></li>
                <li><a href="#contato" className="text-dark-400 hover:text-white transition-colors">Contato</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contato</h4>
              <ul className="space-y-2 text-dark-400">
                <li>{WHATSAPP_DISPLAY}</li>
                <li>Orçamentos pelo WhatsApp</li>
                <li>Retirada base, frete sob consulta</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-dark-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-dark-500 text-sm">
              {new Date().getFullYear()} SomLuz. Todos os direitos reservados.
            </p>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              className="text-dark-400 hover:text-brand-400 transition-colors"
            >
              WhatsApp
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
