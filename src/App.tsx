import { Skull, ChevronRight, ShieldAlert, Fingerprint, Pencil } from 'lucide-react';
import { useState, useEffect } from 'react';
import React from 'react';
import { supabase } from './lib/supabase';

type Step = 'auth' | 'intro' | 'onboarding' | 'contract' | 'dashboard' | 'trophy';

type MealStatus = 'COMPLETED' | 'ACTIVE' | 'PENDING';
type MealItem = { id: number, time: string, name: string, description: string };

const parseM = (str: any) => {
  if (!str || typeof str !== 'string') return 0;
  const [h, m] = str.split(':').map(Number);
  return h * 60 + m;
};

const formatH = (min: number) => {
  if (isNaN(min)) return '00:00';
  let m = min % (24 * 60);
  if (m < 0) m += 24 * 60;
  const h = Math.floor(m / 60);
  const mins = m % 60;
  return `${String(h).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

export default function App() {
  const [step, setStep] = useState<Step>('auth');
  const [authName, setAuthName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authPin, setAuthPin] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [userNameDisplay, setUserNameDisplay] = useState('RECRUTA');
  const [signed, setSigned] = useState(false);
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [initialWeight, setInitialWeight] = useState('');
  const [weightToLose, setWeightToLose] = useState('');
  const [moduleStartWeight, setModuleStartWeight] = useState('');
  const [currentWeight, setCurrentWeight] = useState('');
  const [dashboardState, setDashboardState] = useState<'report_weight' | 'infraction' | 'active'>('report_weight');
  const [budget, setBudget] = useState('');
  const [trainingTime, setTrainingTime] = useState('18:30');
  const [trainingEndTime, setTrainingEndTime] = useState('19:30');
  const [draftTrainingTime, setDraftTrainingTime] = useState('18:30');
  const [draftTrainingEndTime, setDraftTrainingEndTime] = useState('19:30');
  const [alcohol, setAlcohol] = useState(false);
  const [smokes, setSmokes] = useState(false);
  const [trains, setTrains] = useState(false);
  const [completedIds, setCompletedIds] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<'today' | 'tomorrow' | 'stock' | 'missions' | 'scanner' | 'academy'>('today');
  const [stockSubTab, setStockSubTab] = useState<'shopping' | 'inventory' | 'finances'>('shopping');
  const [waterConsumed, setWaterConsumed] = useState(0);
  const [moodLog, setMoodLog] = useState({ stress: 0, anxiety: 0, hunger: 0 });
  const [scanResult, setScanResult] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [shoppingList, setShoppingList] = useState<{ id: number, name: string, quantity: number, unit: string, purchased: boolean, haveIt?: boolean, price?: number }[]>([]);
  const [inventory, setInventory] = useState<{name: string, quantity: number, unit: string, icon: string}[]>([]);
  const [weeklySpent, setWeeklySpent] = useState(0);
  const [monthlySpent, setMonthlySpent] = useState(0);
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [isGeneratingShopping, setIsGeneratingShopping] = useState(false);
  const [tomorrowPrepared, setTomorrowPrepared] = useState(false);
  const [currentTime, setCurrentTime] = useState(() => 
    new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  );
  const [loaded, setLoaded] = useState(false);
  
  // Tactical progression & daily tracking
  const [lastWeightReportDate, setLastWeightReportDate] = useState('');
  const [infractionPaidDate, setInfractionPaidDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [goalDurationMonths, setGoalDurationMonths] = useState('2');

  const todayStr = new Date().toLocaleDateString('pt-BR');

  useEffect(() => {
    async function loadState() {
      const applyParsedState = (parsed: any) => {
        if (parsed.step) setStep(parsed.step);
        if (parsed.signed !== undefined) setSigned(parsed.signed);
        if (parsed.age) setAge(parsed.age);
        if (parsed.height) setHeight(parsed.height);
        if (parsed.initialWeight) setInitialWeight(parsed.initialWeight);
        if (parsed.weightToLose) setWeightToLose(parsed.weightToLose);
        if (parsed.moduleStartWeight) setModuleStartWeight(parsed.moduleStartWeight);
        if (parsed.currentWeight) setCurrentWeight(parsed.currentWeight);
        if (parsed.dashboardState) setDashboardState(parsed.dashboardState);
        if (parsed.budget) setBudget(parsed.budget);
        if (parsed.trainingTime) {
          setTrainingTime(parsed.trainingTime);
          setDraftTrainingTime(parsed.trainingTime);
        }
        if (parsed.trainingEndTime) {
          setTrainingEndTime(parsed.trainingEndTime);
          setDraftTrainingEndTime(parsed.trainingEndTime);
        }
        if (parsed.alcohol !== undefined) setAlcohol(parsed.alcohol);
        if (parsed.smokes !== undefined) setSmokes(parsed.smokes);
        if (parsed.trains !== undefined) setTrains(parsed.trains);
        if (Array.isArray(parsed.completedIds)) setCompletedIds(parsed.completedIds);
        else setCompletedIds([]);
        if (typeof parsed.activeTab === 'string') setActiveTab(parsed.activeTab as any);
        if (typeof parsed.waterConsumed === 'number') setWaterConsumed(parsed.waterConsumed);
        if (parsed.moodLog) setMoodLog(parsed.moodLog);
        if (typeof parsed.stockSubTab === 'string') setStockSubTab(parsed.stockSubTab as any);
        if (Array.isArray(parsed.shoppingList)) setShoppingList(parsed.shoppingList);
        
        let ghostDetected = false;
        if (typeof parsed.weeklySpent === 'number') {
           if (parsed.weeklySpent === 143.5) ghostDetected = true;
           setWeeklySpent(ghostDetected ? 0 : parsed.weeklySpent);
        }
        if (typeof parsed.monthlySpent === 'number') {
           setMonthlySpent(ghostDetected ? 0 : parsed.monthlySpent);
        }
        if (Array.isArray(parsed.inventory)) {
           if (ghostDetected && parsed.inventory.length === 4 && parsed.inventory[0].name === 'Proteína') {
             setInventory([]);
           } else {
             setInventory(parsed.inventory);
           }
        }
        
        if (parsed.tomorrowPrepared !== undefined) setTomorrowPrepared(parsed.tomorrowPrepared);
        if (parsed.lastWeightReportDate) setLastWeightReportDate(parsed.lastWeightReportDate);
        if (parsed.infractionPaidDate) setInfractionPaidDate(parsed.infractionPaidDate);
        if (parsed.startDate) setStartDate(parsed.startDate);
        if (parsed.goalDurationMonths) setGoalDurationMonths(parsed.goalDurationMonths);
      }

      // 1. Tenta carregar do localStorage primeiro
      const saved = localStorage.getItem('choqueFitState_v1');
      if (saved) {
        try {
          applyParsedState(JSON.parse(saved));
        } catch (e) {
          console.error('Failed to parse saved state', e);
        }
      }

      // 2. Se o Supabase estiver configurado, tenta sincronizar e prioriza a nuvem
      if (supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          let user = session?.user;

          if (!user) {
            setStep('auth');
          }

          if (user) {
            if (user.user_metadata?.name) {
               setUserNameDisplay(user.user_metadata.name.toUpperCase());
            }

            const { data: dbData } = await supabase
              .from('user_app_state')
              .select('state_data')
              .eq('user_id', user.id)
              .single();

            if (dbData?.state_data && Object.keys(dbData.state_data).length > 0) {
               applyParsedState(dbData.state_data);
            } else if (step === 'auth') {
               setStep('intro');
            }
          }
        } catch (e) {
          console.error("Erro ao sincronizar com Supabase na carga inicial", e);
        }
      }
      setLoaded(true);
    }
    loadState();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    
    const stateObj = {
      step, signed, age, height, initialWeight, weightToLose, moduleStartWeight, currentWeight, 
      dashboardState, budget, trainingTime, trainingEndTime, alcohol, smokes, trains, 
      completedIds, activeTab, waterConsumed, moodLog, stockSubTab, shoppingList, inventory, weeklySpent, monthlySpent, tomorrowPrepared, lastWeightReportDate, infractionPaidDate, startDate, goalDurationMonths
    };

    // 1. Salva sempre localmente como backup
    localStorage.setItem('choqueFitState_v1', JSON.stringify(stateObj));

    // 2. Sincroniza com a nuvem, se houver
    if (supabase) {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
           supabase.from('user_app_state').upsert({
             user_id: user.id,
             state_data: stateObj
           }).then(({ error }) => {
             if (error) console.error("Falha ao salvar no Supabase", error);
           });
        }
      }).catch(() => {});
    }
  }, [loaded, step, signed, age, height, initialWeight, weightToLose, moduleStartWeight, currentWeight, dashboardState, budget, trainingTime, trainingEndTime, alcohol, smokes, trains, completedIds, activeTab, waterConsumed, moodLog, stockSubTab, shoppingList, inventory, weeklySpent, monthlySpent, tomorrowPrepared, lastWeightReportDate, infractionPaidDate, startDate, goalDurationMonths]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const PATENTS = ['RECRUTA', 'SOLDADO', 'CABO', 'SARGENTO', 'TENENTE', 'CAPITÃO', 'MAJOR', 'TENENTE-CORONEL', 'CORONEL FULL'];
  const rawElapsedDays = (startDate && typeof startDate === 'string') ? Math.floor((new Date().getTime() - new Date(startDate.split('/').reverse().join('-')).getTime()) / (1000 * 3600 * 24)) : 0;
  const elapsedDays = isNaN(rawElapsedDays) ? 0 : rawElapsedDays;
  
  const initWGlobal = parseFloat(initialWeight) || 0;
  const targetLossGlobal = parseFloat(weightToLose) || 0;
  const currWGlobal = parseFloat(currentWeight || moduleStartWeight || initialWeight) || 0;
  const totalGoalWeeksGlobal = parseInt(goalDurationMonths || '2') * 4;
  const weeklyLossGoalGlobal = (targetLossGlobal > 0 && totalGoalWeeksGlobal > 0) ? targetLossGlobal / totalGoalWeeksGlobal : 1;
  const totalLostWeight = (initWGlobal > 0 && currWGlobal > 0) ? initWGlobal - currWGlobal : 0;
  const metasBatidas = Math.floor(Math.max(0, totalLostWeight) / weeklyLossGoalGlobal);
  
  const rawRankIndex = metasBatidas;
  const currentRankIndex = isNaN(rawRankIndex) ? 0 : Math.min(PATENTS.length - 1, Math.max(0, rawRankIndex));
  const currentRank = PATENTS[currentRankIndex] || 'RECRUTA';
  const safeElapsedDays = isNaN(elapsedDays) ? 0 : Math.max(0, elapsedDays);
  const targetDay = activeTab === 'tomorrow' ? safeElapsedDays + 1 : safeElapsedDays;

  const getDietVariation = (targetDayNum: number, returnAll = false) => {
    let dayOfWeek = new Date().getDay();
    if (activeTab === 'tomorrow') {
       const d = new Date();
       d.setDate(d.getDate() + 1);
       dayOfWeek = d.getDay();
    }

    const defaultLow = [
      { breakfast: 'Panqueca de Banana (2 ovos + 1 banana)', lunch: '150g Frango Cozido + 100g Macarrão + Tomate', pre: 'Café Forte + 2 Pães de Sal', post: '150g Frango Grelhado + Salada Verde' }, // Domingo
      { breakfast: '4 Ovos Mexidos + 30g Aveia', lunch: '150g Frango Grelhado + 100g Arroz Branco + Cenoura', pre: '2 Fatias de Pão com Doce de Leite', post: '200g Frango Desfiado + Salada' }, // Segunda
      { breakfast: 'Crepioca (2 ovos + 2 c. sopa tapioca)', lunch: '150g Iscas de Frango + 100g Batata Inglesa + Repolho', pre: '1 Banana Amassada com Aveia', post: 'Omelete de 3 ovos + Espinafre' }, // Terça
      { breakfast: '3 Ovos Mexidos + 1 Maçã', lunch: '150g Carne Suína Magra + 100g Arroz + Couve', pre: 'Banana com Canela', post: '150g Omelete com Peito de Peru' }, // Quarta
      { breakfast: 'Mingau Proteico (Aveia + 3 claras + 1 gema)', lunch: '150g Frango + 150g Abóbora + Salada', pre: '2 Torradas com Doce de Leite', post: '150g Atum + Salada Verde' }, // Quinta
      { breakfast: 'Vitamina (Banana + Morango + Aveia)', lunch: '150g Carne Moída Magra + Purê de Batata', pre: 'Iogurte Natural + Mel', post: '2 Fatias de Pão com Queijo Branco' }, // Sexta
      { breakfast: 'Omelete de 4 ovos + Queijo Branco', lunch: '150g Sobrecoxa Assada + 100g Arroz Integral', pre: '1 Maçã + Pasta de Amendoim', post: '150g Frango Desfiado + Cenoura Ralada' } // Sábado
    ];
    
    let variants = defaultLow;
    if (budget === 'MÉDIO - BALANCEADO') {
      variants = [
        { breakfast: 'Iogurte Proteico + Frutas Vermelhas + Aveia', lunch: '150g Sobrecoxa Desossada + 100g Purê de Abóbora + Couve', pre: 'Banana + Pasta de Amendoim', post: '150g Carne Moída Magra + Salada Mista' },
        { breakfast: '3 Ovos + 2 Fatias Pão Integral + Queijo Minas', lunch: '150g Patinho Moído + 100g Arroz Integral + Brócolis', pre: 'Iogurte Natural com Mel e Granola', post: '150g Tilápia + Mandioca Cozida' },
        { breakfast: 'Mingau de Aveia com Whey Protein', lunch: '150g Peito de Frango + 100g Quinoa + Tomate Cereja', pre: 'Pão Integral com Geleia 100% Fruta', post: 'Omelete de 4 Claras e 1 Gema com Atum' },
        { breakfast: 'Pão de Queijo Fit (Tapioca e Queijo) + Ovos', lunch: '150g Filé de Pescada + 100g Batata Doce', pre: 'Mingau de Arroz com Whey', post: '150g Strogonoff de Frango Fit (Iogurte)' },
        { breakfast: 'Omelete de 3 ovos + Espinafre + Queijo', lunch: '150g Frango Assado + 150g Mandioquinha', pre: 'Whey com Maçã e Canela', post: '150g Tilápia Assada + Brócolis' },
        { breakfast: 'Panqueca de Aveia Média (2 ovos, Aveia, Cacau)', lunch: '150g Iscas de Carne + 100g Arroz Sete Grãos', pre: 'Iogurte com Aveia + Mel', post: '150g Frango Grelhado + Salada Mix' },
        { breakfast: 'Bowl de Açaí Zero + Whey + Morangos', lunch: '150g Peixe Branco + 100g Purê de Batata Doce', pre: '2 Bananas Amassadas + Mel', post: '150g Frango Desfiado com Ricota' }
      ];
    } else if (budget === 'ALTO - PROTEÍNAS PREMIUM') {
      variants = [
        { breakfast: 'Waffles Proteicos (Whey) + Calda Zero + Morangos', lunch: '150g Picanha Magra + 100g Arroz Negro + Cogumelos', pre: 'Pré-Treino Premium + Tapioca com Queijo Cottage', post: '150g Atum Fresco Selado + Legumes Braseados' },
        { breakfast: '3 Ovos Orgânicos + Abacate + Pão de Fermentação Natural', lunch: '150g Filé Mignon + 100g Batata Baroa + Aspargos', pre: 'Whey Isolado + Palatinose', post: '150g Salmão Grelhado + Salada de Rúcula' },
        { breakfast: 'Ovos Benedict Fit (Presunto Parma) + Suco Verde', lunch: '150g Alcatra + 100g Grão de Bico + Espinafre', pre: 'Açaí Puro com Whey Protein e Kiwi', post: '150g Camarão Grelhado + Aspargos' },
        { breakfast: 'Crepioca de Claras com Salmão Defumado', lunch: '150g Cordeiro Grelhado + 100g Quinoa + Zucchini', pre: 'Vitamina de Avocado com Whey Isolado', post: '150g Peito de Peru Fatiado Fresco + Salada Caprese' },
        { breakfast: 'Omelete Trufado com Queijo Brie + Ovos Orgânicos', lunch: '150g Filé de Atum Selado + Arroz de Couve-Flor', pre: 'Mingau Whey Isolado com Mirtilos', post: '150g Mignon Suíno + Purê de Maçã' },
        { breakfast: 'Panqueca de Amêndoas com Whey Zero + Geleia Importada', lunch: '150g Ribeye Magro + Aspargos e Tomates Confit', pre: 'Iogurte Quark + Frutas Silvestres', post: '150g Peito de Frango Caipira + Couscous Marroquino' },
        { breakfast: 'Vitamina de Proteína + Leite de Amêndoas + Morangos', lunch: '150g Polvo Grelhado + Batatas Rústicas e Alho Poró', pre: 'Barrinha Protéica Premium + Café Expresso', post: '150g Carpaccio de Carne + Alcaparras e Parmesão' }
      ];
    }
    
    if (returnAll) return variants as any;
    return (variants[dayOfWeek % variants.length] || variants[0]) as any;
  };

  const currentDiet = getDietVariation(targetDay);

  const tTraining = parseM(trainingTime);
  const tTrainingEnd = parseM(trainingEndTime);
  
  let tAlvorada = parseM('07:30');
  let tAlmoco = parseM('12:30');
  let tPre = tTraining - 90;
  let tPos = tTrainingEnd + 30;

  if (tTraining < parseM('10:00')) {
    tAlvorada = tTraining - 120;
    if (tAlvorada < 0) tAlvorada = 0;
    tPre = Math.max(tAlvorada + 30, tTraining - 30);
    tAlmoco = Math.max(parseM('12:30'), tPos + 120);
  } else if (tTraining < parseM('14:00')) {
    tAlvorada = parseM('07:00');
    tPre = tTraining - 60;
    tAlmoco = tPos + 60;
  }

  const rawItems: MealItem[] = [
    { id: 1, time: formatH(tAlvorada), name: 'ALVORADA NUTRICIONAL', description: currentDiet.breakfast + ' + Café (Sem Açúcar)' },
    { id: 2, time: formatH(tAlmoco), name: 'PONTO DE CONTROLE ALPHA', description: currentDiet.lunch },
    { id: 3, time: formatH(tPre), name: 'RAÇÃO DE COMBATE', description: `Módulo Rápido: ${currentDiet.pre} + Café/Pré-Treino` },
    { id: 4, time: trainingTime, name: `MISSÃO FÍSICA: DIA ${Math.max(1, targetDay + 1)}`, description: `Treino de Choque Tático. Destrua seus limites. Patente Atual: ${currentRank}.` },
    { id: 5, time: formatH(tPos), name: 'RECOLHIMENTO TÁTICO', description: `Recuperação: ${currentDiet.post}` },
  ];
  rawItems.sort((a,b) => parseM(a.time) - parseM(b.time));

  let activeFound = false;
  const meals = rawItems.map(item => {
     const isCompleted = Array.isArray(completedIds) && completedIds.includes(item.id);
     let status: MealStatus = 'PENDING';
     if (isCompleted) {
         status = 'COMPLETED';
     } else if (!activeFound) {
         status = 'ACTIVE';
         activeFound = true;
     }
     return { ...item, status };
  });

  const generateShoppingList = async () => {
    setIsGeneratingShopping(true);
    try {
      const response = await fetch('/api/logistics/gemini-shopping-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ budget, inventory, activeTab, menu: getDietVariation(0, true) })
      });
      if (response.ok) {
        const toBuy = await response.json();
        setShoppingList(toBuy.map((item: any) => ({ ...item, price: 0 })));
      } else {
        console.error('Failed to generate logistics list');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingShopping(false);
    }
  };

  const handleMarkCompleted = (id: number) => {
    setCompletedIds(prev => {
      const next = [...prev, id];
      if (next.length === rawItems.length) {
        setTimeout(() => setStep('trophy'), 600);
      }
      return next;
    });

    const meal = rawItems.find(m => m.id === id);
    if (!meal) return;
    
    // Simulate deducting from inventory (Mágica da Logística)
    setInventory(prev => prev.map(inv => {
       if (inv.name === 'Proteína' && inv.quantity > 0) {
           return { ...inv, quantity: Math.max(0, inv.quantity - 0.15) }; // Deduct 150g per meal usually
       }
       if (inv.name === 'Ovos' && inv.quantity > 0) {
           return { ...inv, quantity: Math.max(0, inv.quantity - 2) }; // Deduct 2 eggs per meal usually
       }
       if (inv.name === 'Carboidrato' && inv.quantity > 0) {
           return { ...inv, quantity: Math.max(0, inv.quantity - 0.1) }; // Deduct 100g per meal usually
       }
       return inv;
    }));
  };

  // Force daily sync
  useEffect(() => {
    if (!loaded) return;
    if (step === 'dashboard' && lastWeightReportDate !== todayStr) {
      if (currentTime >= '09:00' && infractionPaidDate !== todayStr && dashboardState !== 'infraction') {
         setDashboardState('infraction');
      } else if ((currentTime < '09:00' || infractionPaidDate === todayStr) && dashboardState !== 'report_weight') {
         setDashboardState('report_weight');
      }
    }
  }, [step, currentTime, lastWeightReportDate, dashboardState, loaded, infractionPaidDate]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setAuthError('Falha Crítica: Supabase não conectado. Verifique as variáveis de ambiente (VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY).');
      return;
    }
    
    const cleanPhone = authPhone.replace(/\D/g, '');
    if (cleanPhone.length < 8) {
      setAuthError('Telefone inválido. Insira apenas os números.');
      return;
    }
    if (authPin.length !== 6 || !/^\d+$/.test(authPin)) {
      setAuthError('A senha (PIN) deve conter exatamente 6 números.');
      return;
    }

    setAuthError('');
    setAuthLoading(true);
    
    const email = `${cleanPhone}@choquefit.app`;

    try {
      if (isLoginMode) {
        const { error } = await supabase.auth.signInWithPassword({ email, password: authPin });
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            throw new Error('Credenciais inválidas. Verifique seu telefone e PIN.');
          }
          throw error;
        }
        window.location.reload();
      } else {
        if (!authName) {
           throw new Error('Informe seu nome de guerra (Nome completo) para cadastrar.');
        }
        const { error } = await supabase.auth.signUp({ 
           email, 
           password: authPin,
           options: {
             data: { name: authName, phone: cleanPhone }
           }
        });
        if (error) throw error;
        setStep('intro');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Erro durante a autenticação. Contate a base.');
    } finally {
      setAuthLoading(false);
    }
  };

  if (step === 'auth') {
    return (
      <main className="min-h-screen bg-[#0A0A0A] text-[#E0E0E0] flex flex-col items-center justify-center p-6 font-sans select-none">
        <div className="max-w-md w-full border-2 border-[#1A1A1A] p-8 bg-[#111] shadow-[8px_8px_0px_0px_rgba(34,197,94,0.15)] relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2 opacity-10">
            <Fingerprint className="w-24 h-24 text-green-500" />
          </div>
          
          <h1 className="text-3xl font-black mb-2 text-white uppercase tracking-tighter relative z-10 flex border-b-2 border-green-500 pb-2">
            <span className="text-green-500 mr-2">CHOQUEFIT</span> TERMINAL
          </h1>
          <p className="text-neutral-500 text-sm font-mono uppercase tracking-widest mb-6 border-l-2 border-neutral-700 pl-2">
            Autenticação Biométrica Pendente.
          </p>

          <div className="flex border-b border-[#333] mb-6">
             <button 
               onClick={() => { setIsLoginMode(true); setAuthError(''); }}
               className={`flex-1 py-2 font-black tracking-widest text-sm uppercase transition-colors ${isLoginMode ? 'text-green-500 border-b-2 border-green-500 bg-green-900/10' : 'text-neutral-500 hover:text-white'}`}
             >
               ENTRAR
             </button>
             <button 
               onClick={() => { setIsLoginMode(false); setAuthError(''); }}
               className={`flex-1 py-2 font-black tracking-widest text-sm uppercase transition-colors ${!isLoginMode ? 'text-green-500 border-b-2 border-green-500 bg-green-900/10' : 'text-neutral-500 hover:text-white'}`}
             >
               RECRUTAMENTO
             </button>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4 relative z-10 font-mono">
            {!isLoginMode && (
              <div>
                <label className="block text-xs uppercase tracking-widest text-neutral-400 mb-1">NOME DE GUERRA</label>
                <input
                  type="text"
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  className="w-full bg-black border border-[#333] p-3 text-white focus:border-green-500 outline-none uppercase placeholder:text-neutral-700"
                  placeholder="EX: SD SILVA"
                />
              </div>
            )}
            
            <div>
              <label className="block text-xs uppercase tracking-widest text-neutral-400 mb-1">CÓDIGO DE TRANSMISSÃO (CELULAR)</label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-neutral-500 font-mono pointer-events-none">+55</span>
                <input
                  type="tel"
                  value={authPhone}
                  onChange={(e) => setAuthPhone(e.target.value)}
                  className="w-full bg-black border border-[#333] py-3 pr-3 pl-12 text-white focus:border-green-500 outline-none placeholder:text-neutral-700"
                  placeholder="DDD + NÚMERO"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs uppercase tracking-widest text-neutral-400 mb-1">PIN DE ACESSO (6 DÍGITOS)</label>
              <input
                type="password"
                maxLength={6}
                value={authPin}
                onChange={(e) => setAuthPin(e.target.value)}
                className="w-full bg-black border border-[#333] p-3 text-white focus:border-green-500 outline-none placeholder:text-neutral-700 text-center tracking-[1em]"
                placeholder="******"
              />
            </div>

            {authError && (
              <div className="bg-red-900/20 border border-red-500/50 p-3 text-red-500 text-xs font-mono">
                {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={authLoading}
              className="w-full bg-green-600 hover:bg-green-500 text-black font-black uppercase tracking-widest py-4 mt-4 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <ChevronRight className="w-5 h-5" />
              {authLoading ? 'CONECTANDO...' : (isLoginMode ? 'ACESSAR DATABASE' : 'SOLICITAR ACESSO')}
            </button>
          </form>
        </div>
      </main>
    );
  }

  // Módulo 1: Tela Inicial (Impacto e Onboarding)
  if (step === 'intro') {
    return (
      <main className="min-h-screen bg-[#0A0A0A] text-[#E0E0E0] flex flex-col items-center justify-center p-6 text-center select-none">
        <div
          
          
          
          className="max-w-xl w-full border-4 border-[#1A1A1A] p-8 bg-[#141414] shadow-[10px_10px_0px_0px_rgba(234,88,12,0.1)]"
        >
          <div className="w-20 h-20 bg-black border-2 border-[#222] mx-auto flex items-center justify-center mb-8">
            <Skull className="w-10 h-10 text-orange-500" />
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter mb-2 uppercase text-white leading-none">
            Choque <span className="text-orange-500">Fit</span>
          </h1>
          <p className="text-orange-500 font-mono text-sm uppercase tracking-[0.3em] font-bold mb-12">
            Projeto: Operação Implacável
          </p>
          
          <div className="flex flex-col shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] border-2 border-[#111] mb-4">
            <div className="bg-[#0A0A0A] border-l-4 border-red-600 p-6 md:p-8 text-left relative">
              <h2 className="text-red-600 font-black mb-4 flex items-center gap-2 uppercase tracking-tighter text-2xl">
                <ShieldAlert className="w-7 h-7" /> AVISO DO INSTRUTOR
              </h2>
              <p className="text-[#E0E0E0] text-sm md:text-base leading-relaxed mb-6 font-bold tracking-wide uppercase">
                “AQUI É TERRENO DE DISCIPLINA. O PROCEDIMENTO É SEGUIDO À RISCA. SEM CHORO, SEM FALHAS, E SEM ALTERAÇÕES NÃO AUTORIZADAS NA ESCALA ALIMENTAR. AQUELES QUE BUSCAM CONFORTO EMOCIONAL SÃO CONSIDERADOS INAPTOS. A OPERAÇÃO É UMA BATALHA MATEMÁTICA QUE SÓ PODE SER VENCIDA PELA EXECUÇÃO EXATA DE ORDENS. OS SENTIMENTOS SÃO UM OBSTÁCULO TÁTICO.”
              </p>
              
              <p className="text-orange-500 text-sm md:text-base leading-relaxed mb-6 font-black tracking-wide uppercase">
                VOCÊ ESTÁ PREPARADO PARA ALCANÇAR A MAIOR PATENTE?
              </p>

              <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest italic">
                // REQUISITOS MÍNIMOS: DISCIPLINA EXTREMA
              </p>
            </div>

            <button 
              onClick={() => setStep('onboarding')}
              className="w-full bg-[#EA580C] hover:bg-[#F97316] text-black font-black py-5 uppercase tracking-tighter text-xl transition-colors flex items-center justify-center gap-2 relative border-t-2 border-[#111] animate-pulse hover:animate-none"
            >
              ALISTAR-ME AGORA <ChevronRight className="w-6 h-6 stroke-[3]" />
            </button>
          </div>
        </div>
      </main>
    );
  }

  // Módulo 1: Questionário Tático
  if (step === 'onboarding') {
    return (
      <main className="min-h-screen bg-[#0A0A0A] text-[#E0E0E0] flex flex-col items-center justify-center p-6">
        <div
          
          
          className="max-w-md w-full border-4 border-[#1A1A1A] bg-[#141414] p-8 shadow-[8px_8px_0px_0px_rgba(255,255,255,0.05)] relative"
        >
          <div className="absolute top-0 right-0 p-4">
             <span className="text-orange-500 font-mono text-xs font-bold uppercase tracking-[0.2em] bg-black border border-[#222] px-2 py-1">PASSO 1/2</span>
          </div>

          <h2 className="text-3xl font-black uppercase tracking-tighter mb-8 border-b-2 border-orange-600 pb-4 text-white">
            DADOS DE COMBATE
          </h2>

          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 tracking-widest uppercase italic mb-2 text-left flex justify-between">
                <span>IDADE MILITAR</span>
                <span className="opacity-70">[EDITÁVEL]</span>
              </label>
              <div className="relative group">
                <input 
                  type="number" 
                  value={age}
                  onChange={e => setAge(e.target.value)}
                  placeholder="EX: 28" 
                  className="w-full bg-black border border-[#333] p-4 pr-12 text-white focus:outline-none focus:border-orange-500 transition-colors font-mono font-bold text-xl uppercase placeholder:text-neutral-700" 
                />
                <Pencil className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-600 pointer-events-none group-focus-within:text-orange-500 group-hover:text-neutral-400 transition-colors" />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-neutral-500 tracking-widest uppercase italic mb-2 text-left flex justify-between">
                  <span>PESO ATUAL (KG)</span>
                </label>
                <div className="relative group">
                  <input 
                    type="number" 
                    step="0.1"
                    value={initialWeight}
                    onChange={(e) => setInitialWeight(e.target.value)}
                    placeholder="00.0" 
                    className="w-full bg-black border border-[#333] p-4 pr-12 text-white focus:outline-none focus:border-orange-500 transition-colors font-mono font-bold text-xl uppercase placeholder:text-neutral-700" 
                  />
                  <Pencil className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-600 pointer-events-none group-focus-within:text-orange-500 group-hover:text-neutral-400 transition-colors" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-neutral-500 tracking-widest uppercase italic mb-2 text-left flex justify-between">
                  <span>ALTURA (CM)</span>
                </label>
                <div className="relative group">
                  <input 
                    type="number" 
                    value={height}
                    onChange={e => setHeight(e.target.value)}
                    placeholder="175" 
                    className="w-full bg-black border border-[#333] p-4 pr-12 text-white focus:outline-none focus:border-orange-500 transition-colors font-mono font-bold text-xl uppercase placeholder:text-neutral-700" 
                  />
                  <Pencil className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-600 pointer-events-none group-focus-within:text-orange-500 group-hover:text-neutral-400 transition-colors" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-neutral-500 tracking-widest uppercase italic mb-2 text-left">PERFIL PSICOLÓGICO E ROTINA (INTERROGATÓRIO TÁTICO)</label>
              <div className="grid grid-cols-3 gap-2 mb-4">
                <button 
                  onClick={() => setAlcohol(!alcohol)} 
                  className={`p-3 border font-bold uppercase text-[10px] sm:text-xs transition-colors flex items-center justify-center gap-1 ${alcohol ? 'bg-orange-600 border-orange-500 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-black border-[#333] text-neutral-500 hover:text-white'}`}
                >
                  <div className={`w-2 h-2 rounded-full ${alcohol ? 'bg-white' : 'bg-neutral-600'}`}></div>
                  ÁLCOOL
                </button>
                <button 
                  onClick={() => setSmokes(!smokes)} 
                  className={`p-3 border font-bold uppercase text-[10px] sm:text-xs transition-colors flex items-center justify-center gap-1 ${smokes ? 'bg-orange-600 border-orange-500 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-black border-[#333] text-neutral-500 hover:text-white'}`}
                >
                   <div className={`w-2 h-2 rounded-full ${smokes ? 'bg-white' : 'bg-neutral-600'}`}></div>
                  FUMO
                </button>
                <button 
                  onClick={() => setTrains(!trains)} 
                  className={`p-3 border font-bold uppercase text-[10px] sm:text-xs transition-colors flex items-center justify-center gap-1 ${trains ? 'bg-orange-600 border-orange-500 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-black border-[#333] text-neutral-500 hover:text-white'}`}
                >
                   <div className={`w-2 h-2 rounded-full ${trains ? 'bg-white' : 'bg-neutral-600'}`}></div>
                  TREINA
                </button>
              </div>

              {trains && (
                <div className="mb-4 animate-in fade-in slide-in-from-top-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-orange-500 tracking-widest uppercase italic mb-2 text-left flex justify-between">
                        <span>INÍCIO DO TREINO</span>
                        <span className="opacity-70">[EDI]</span>
                      </label>
                      <div className="relative group">
                        <input 
                          type="time" 
                          value={trainingTime}
                          onChange={(e) => setTrainingTime(e.target.value)}
                          style={{ colorScheme: 'dark' }}
                          className="w-full bg-black border border-orange-600/50 p-4 pr-12 text-orange-500 focus:outline-none focus:border-orange-500 transition-colors font-mono font-bold text-xl uppercase placeholder:text-neutral-700 cursor-text text-center flex justify-center [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-datetime-edit]:p-0 [&::-webkit-datetime-edit]:flex [&::-webkit-datetime-edit]:justify-center [&::-webkit-datetime-edit-fields-wrapper]:flex [&::-webkit-datetime-edit-fields-wrapper]:justify-center" 
                        />
                        <Pencil className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-600/50 pointer-events-none group-focus-within:text-orange-500 group-hover:text-orange-400 transition-colors" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-orange-500 tracking-widest uppercase italic mb-2 text-left flex justify-between">
                        <span>FIM DO TREINO</span>
                        <span className="opacity-70">[EDI]</span>
                      </label>
                      <div className="relative group">
                        <input 
                          type="time" 
                          value={trainingEndTime}
                          onChange={(e) => setTrainingEndTime(e.target.value)}
                          style={{ colorScheme: 'dark' }}
                          className="w-full bg-black border border-orange-600/50 p-4 pr-12 text-orange-500 focus:outline-none focus:border-orange-500 transition-colors font-mono font-bold text-xl uppercase placeholder:text-neutral-700 cursor-text text-center flex justify-center [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-datetime-edit]:p-0 [&::-webkit-datetime-edit]:flex [&::-webkit-datetime-edit]:justify-center [&::-webkit-datetime-edit-fields-wrapper]:flex [&::-webkit-datetime-edit-fields-wrapper]:justify-center" 
                        />
                        <Pencil className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-600/50 pointer-events-none group-focus-within:text-orange-500 group-hover:text-orange-400 transition-colors" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-bold text-neutral-500 tracking-widest uppercase italic mb-2 text-left">ORÇAMENTO LOGÍSTICO (DIETA)</label>
              <div className="flex flex-col gap-3">
                {[
                  'BAIXO - OVOS E FRANGO',
                  'MÉDIO - BALANCEADO',
                  'ALTO - PROTEÍNAS PREMIUM'
                ].map((option) => (
                  <button
                    key={option}
                    onClick={() => setBudget(option)}
                    className={`w-full p-4 border text-left font-mono font-bold uppercase transition-all ${
                      budget === option
                        ? 'bg-black border-orange-500 text-white'
                        : 'bg-black border-[#333] text-neutral-500 animate-pulse hover:animate-none hover:border-neutral-500 hover:text-white'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-neutral-500 tracking-widest uppercase italic mb-2 text-left flex justify-between">
                <span>QUANTOS QUILOS DESEJA EMAGRECER?</span>
              </label>
              <div className="relative group">
                <input 
                  type="number" 
                  step="0.1"
                  value={weightToLose}
                  onChange={(e) => setWeightToLose(e.target.value)}
                  placeholder="Ex: 10" 
                  className="w-full bg-black border border-[#333] p-4 pr-12 text-white focus:outline-none focus:border-orange-500 transition-colors font-mono font-bold text-xl uppercase placeholder:text-neutral-700" 
                />
                <Pencil className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-600 pointer-events-none group-focus-within:text-orange-500 group-hover:text-neutral-400 transition-colors" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-neutral-500 tracking-widest uppercase italic mb-2 text-left flex justify-between">
                <span>TEMPO DE MISSÃO (MESES)</span>
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 6].map((months) => (
                  <button
                    key={months}
                    onClick={() => setGoalDurationMonths(months.toString())}
                    className={`flex-1 p-4 border font-mono font-bold transition-all ${
                      parseInt(goalDurationMonths) === months
                        ? 'bg-black border-orange-500 text-orange-500'
                        : 'bg-black border-[#333] text-neutral-500 hover:border-neutral-500 hover:text-white'
                    }`}
                  >
                    {months}M
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={() => setStep('contract')}
              disabled={!budget || !age || !height || !initialWeight || !weightToLose}
              className={`w-full font-black py-4 uppercase tracking-tighter text-xl transition-all mt-8 ${
                (budget && age && height && initialWeight && weightToLose)
                  ? 'bg-white hover:bg-neutral-200 text-black shadow-[4px_4px_0px_0px_rgba(234,88,12,1)]' 
                  : 'bg-[#222] text-neutral-600 cursor-not-allowed'
              }`}
            >
              PROSSEGUIR
            </button>
          </div>
        </div>
      </main>
    );
  }

  // Módulo 1: Termo de Compromisso (Assinatura Digital)
  if (step === 'contract') {
    return (
      <main className="min-h-screen bg-[#0A0A0A] text-[#E0E0E0] flex flex-col items-center justify-center p-6">
        <div
          
          
          className="max-w-xl w-full border-4 border-red-600 bg-[#1A1A1A] p-8 shadow-[10px_10px_0px_0px_rgba(220,38,38,0.2)] text-center relative overflow-hidden"
        >
          <div className="bg-black/50 p-6 absolute inset-0 -z-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
          
          <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-6" />
          <h2 className="text-4xl font-black tracking-tighter uppercase mb-6 text-white border-b-2 border-red-600 pb-4 inline-block">TERMO DE ALISTAMENTO</h2>
          
          <div className="bg-black p-6 text-left mb-8 h-48 overflow-y-auto font-mono text-xs text-neutral-400 space-y-4 border border-[#333] leading-relaxed">
            <p className="border-l-2 border-red-500 pl-2">1. Eu entendo que o CHOQUE FIT não medirá minhas desculpas.</p>
            <p className="border-l-2 border-red-500 pl-2">2. Ao não reportar meu peso até as 09:00 AM, deverei pagar 10 agachamentos para liberar o acesso à missão do dia.</p>
            <p className="border-l-2 border-red-500 pl-2">3. Fraudes no input peso/calorias serão detectadas matematicamente e punidas pelo algoritmo.</p>
            <p className="border-l-2 border-red-500 pl-2">4. Se eu falhar na janela de tolerância de 10 minutos (Snooze Tático), a punição será aplicada em exercícios extras obrigatórios.</p>
            <p className="border-l-2 border-red-500 pl-2">5. Eu estou aqui para resultados reais. Não para conforto.</p>
          </div>

          <div
            onClick={() => setSigned(!signed)} 
            className={`border-4 border-dashed ${signed ? 'border-orange-500 bg-orange-500/10' : 'border-[#333] bg-[#141414]'} p-8 cursor-pointer transition-all mb-8 flex flex-col items-center justify-center group`}
          >
            <Fingerprint className={`w-12 h-12 mb-3 ${signed ? 'text-orange-500' : 'text-neutral-500 group-hover:text-white'} transition-colors`} />
            <span className={`font-mono font-bold uppercase tracking-[0.2em] text-xs ${signed ? 'text-orange-500' : 'text-neutral-500'}`}>
              {signed ? 'ASSINATURA REGISTRADA' : 'CLIQUE PARA ASSINAR DIGITALMENTE'}
            </span>
          </div>

          <button 
            disabled={!signed}
            onClick={() => {
               if (!startDate) setStartDate(todayStr); // start immediately if not set
               setStep('dashboard');
            }}
            className={`w-full font-black py-4 uppercase tracking-tighter text-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed ${signed ? 'bg-red-600 hover:bg-red-500 text-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]' : 'bg-[#222] text-neutral-500'}`}
          >
            ENTRAR NO QUARTEL
          </button>
        </div>
      </main>
    );
  }

  // Módulo Final: Sala de Troféus
  if (step === 'trophy') {
    return (
      <main className="min-h-screen bg-[#0A0A0A] text-[#E0E0E0] p-4 md:p-8 flex flex-col font-sans overflow-hidden">
        <div 
          
          
          className="w-full max-w-7xl mx-auto flex flex-col h-full border-4 border-[#1A1A1A] p-6 bg-[#0A0A0A] shadow-[10px_10px_0px_0px_rgba(34,197,94,0.1)]"
        >
          <header className="flex justify-between items-end mb-8 border-b-2 border-green-600 pb-4">
            <div className="leading-none">
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white uppercase">SALA DE TROFÉUS</h1>
              <p className="text-green-500 font-mono text-xs md:text-sm tracking-[0.3em] font-bold mt-1">HISTÓRICO DE SERVIÇO IMUTÁVEL</p>
            </div>
          </header>

          <div className="flex-1 flex items-center justify-center">
            <div className="text-center bg-[#141414] p-8 md:p-12 border-2 border-[#222] shadow-[8px_8px_0px_0px_rgba(255,255,255,0.02)] max-w-2xl w-full">
              <ShieldAlert className="w-20 h-20 text-green-500 mx-auto mb-6" />
              <h2 className="text-4xl font-black uppercase text-white mb-4">MISSÃO CUMPRIDA!</h2>
              <p className="text-neutral-400 max-w-md mx-auto mb-8 font-mono text-sm leading-relaxed">
                VOCÊ SOBREVIVEU AO TREINAMENTO DE HOJE. TODAS AS MISSÕES FORAM EXECUTADAS COM SUCESSO. SEUS DADOS FORAM GRAVADOS.
              </p>
              
              <div className="bg-black border border-[#333] p-6 mb-8 text-left inline-block w-full max-w-md mx-auto">
                <div className="text-[10px] text-neutral-500 font-bold tracking-widest uppercase mb-1">PATENTE ATUAL ALCANÇADA</div>
                <div className="text-3xl font-black text-green-500 uppercase tracking-tighter mb-4">{currentRank}</div>
                
                <div className="border-t border-[#222] pt-4 mt-2">
                  {(() => {
                     const initW = parseFloat(initialWeight);
                     const targetLoss = parseFloat(weightToLose);
                     const currW = parseFloat(currentWeight || moduleStartWeight || initialWeight);
                     const totalGoalWeeks = parseInt(goalDurationMonths || '2') * 4;
                     const weeklyLossGoal = (targetLoss > 0 && totalGoalWeeks > 0) ? targetLoss / totalGoalWeeks : 1;
                     
                     const lostWeight = (!isNaN(initW) && !isNaN(currW)) ? initW - currW : 0;
                     const metasConcluidas = Math.floor(Math.max(0, lostWeight) / weeklyLossGoal);
                     const metaKg = weeklyLossGoal.toFixed(1);
                     
                     if (metasConcluidas > 0) {
                        return (
                          <>
                            <div className="text-[10px] text-orange-500 font-bold tracking-widest uppercase mb-2 animate-pulse">// RECOMPENSA TÁTICA LIBERADA ({metasConcluidas} META(S) SEMANAL(IS) CONCLUÍDA(S))</div>
                            <div className="text-sm font-medium text-white mb-1 uppercase">
                              {alcohol ? "LIBERAÇÃO DE SUPRIMENTO LÍQUIDO [NÍVEL C]" : "LIBERAÇÃO DE RECOMPENSA DE ALTO VALOR"}
                            </div>
                            <div className="text-xs text-neutral-400 font-mono leading-relaxed">
                              {alcohol 
                                ? `A Inteligência Tática ajustou o déficit calórico para comportar sua recompensa por bater a meta de ${metaKg}kg de perda. A Cerveja do Fim de Semana está liberada. Beba com disciplina.` 
                                : `Sua recompensa por bater sua meta semanal de ${metaKg}kg está liberada: Hoje você tem autorização para 1 refeição livre. O déficit já foi reajustado.`}
                            </div>
                          </>
                        );
                     } else {
                        return (
                          <>
                            <div className="text-[10px] text-neutral-500 font-bold tracking-widest uppercase mb-2">// RECOMPENSA TÁTICA (BLOQUEADA)</div>
                            <div className="text-sm font-medium text-white mb-1 uppercase text-neutral-600">
                               BENEFÍCIO REQUER BATER A META DA SEMANA ({metaKg}KG)
                            </div>
                            <div className="text-xs text-neutral-500 font-mono leading-relaxed">
                               O benefício tático / refeição livre só poderá ser dado avançando nas metas da semana. Mantenha o foco. Faltam {(weeklyLossGoal - (Math.max(0, lostWeight) % weeklyLossGoal)).toFixed(1)}kg para o próximo benefício e promoção de patente.
                            </div>
                          </>
                        );
                     }
                  })()}
                </div>
              </div>

              <button 
                onClick={() => {
                  setStep('dashboard');
                  setCompletedIds([]);
                  setDashboardState('report_weight');
                  if (currentWeight) setModuleStartWeight(currentWeight);
                  setCurrentWeight('');
                  setTrainingTime('18:30');
                }}
                className="w-full bg-[#222] hover:bg-[#333] text-white font-black py-5 uppercase tracking-tighter text-xl transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                >
                INICIAR NOVA MISSÃO EXTREMA (RESET TÁTICO)
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Módulo 2: O Dashboard da Verdade (Estado Tático)
  const activeStartWeight = moduleStartWeight || initialWeight || '00.0';
  
  const totalGoalWeeks = parseInt(goalDurationMonths || '2') * 4;
  const targetLoss = parseFloat(weightToLose) || 0;
  const initialW = parseFloat(initialWeight) || 0;
  const weeklyLossGoalAmount = (targetLoss > 0 && totalGoalWeeks > 0) ? targetLoss / totalGoalWeeks : 0.8;
  const weeklyGoal = activeStartWeight !== '00.0' ? (parseFloat(activeStartWeight) - weeklyLossGoalAmount).toFixed(1) : '00.0';

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-[#E0E0E0] p-4 md:p-8 flex flex-col font-sans overflow-hidden">
      <div 
        
        
        className="w-full max-w-7xl mx-auto flex flex-col h-full border-4 border-[#1A1A1A] p-6 bg-[#0A0A0A]"
      >
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 border-b-2 border-orange-600 pb-4 gap-4">
          <div className="leading-none">
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white uppercase">Choque Fit</h1>
            <p className="text-orange-500 font-mono text-xs md:text-sm tracking-[0.3em] font-bold mt-1">SISTEMA DE MONITORAMENTO TÁTICO V1.0</p>
          </div>
          <div className="flex justify-between w-full md:w-auto items-end">
            <button 
              onClick={() => setStep('onboarding')}
              className="md:hidden flex items-center gap-2 text-xs font-mono font-bold text-neutral-400 border border-[#333] px-3 py-1.5 hover:bg-[#333] hover:text-white transition-colors"
            >
              <Pencil className="w-3 h-3" />
              EDITAR DADOS
            </button>
            <div className="text-right font-mono hidden md:block">
              <div className="text-neutral-500 text-xs uppercase mb-1 flex items-center justify-end gap-2">
                <span>OPERADOR: <span className="text-white">{currentRank} {userNameDisplay}</span></span>
                <button 
                  onClick={() => setStep('onboarding')} 
                  className="text-orange-500 hover:text-white hover:bg-orange-600 p-1 border border-orange-500/30 transition-colors tooltip"
                  title="Editar Dados de Combate"
                >
                  <Pencil className="w-3 h-3" />
                </button>
              </div>
              <div className="text-neutral-500 text-xs uppercase">HORA: <span className="text-red-500">{currentTime}</span></div>
            </div>
          </div>
        </header>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6 transition-all">
           <div className="bg-[#141414] border border-[#222] p-4 flex flex-col justify-between">
             <span className="text-[10px] font-bold text-neutral-500 tracking-widest uppercase italic">PESO ALISTAMENTO</span>
             <div className="text-4xl md:text-5xl font-black text-white">{initialWeight || '00.0'}<span className="text-sm md:text-lg font-normal text-neutral-600 ml-1">KG</span></div>
             <div className="h-1 bg-neutral-800 w-full mt-2"><div className="h-full bg-neutral-600 w-[10%]"></div></div>
           </div>
           <div className="bg-[#141414] border border-[#222] p-4 flex flex-col justify-between">
             <span className="text-[10px] font-bold text-neutral-500 tracking-widest uppercase italic">META FINAL</span>
             <div className="text-4xl md:text-5xl font-black text-white">{initialWeight && weightToLose ? (parseFloat(initialWeight) - parseFloat(weightToLose)).toFixed(1) : '00.0'}<span className="text-sm md:text-lg font-normal text-neutral-600 ml-1">KG</span></div>
             <div className="h-1 bg-neutral-800 w-full mt-2"><div className="h-full bg-green-500 w-[100%]"></div></div>
           </div>
           <div className={`bg-[#141414] p-4 flex flex-col justify-between ${dashboardState === 'report_weight' ? 'border border-[#222]' : 'border-2 border-orange-600 shadow-[4px_4px_0px_0px_rgba(234,88,12,0.1)]'}`}>
             <span className={`text-[10px] font-bold tracking-widest uppercase italic ${dashboardState === 'report_weight' ? 'text-neutral-500' : 'text-orange-500'}`}>PESO ATUAL</span>
             <div className="text-4xl md:text-5xl font-black text-white">{dashboardState === 'report_weight' ? '??.?' : (currentWeight || '??.?')}<span className="text-sm md:text-lg font-normal text-neutral-600 ml-1">KG</span></div>
             <div className={`text-[10px] font-bold mt-2 font-mono ${dashboardState === 'report_weight' ? 'text-neutral-600' : 'text-green-500'}`}>
               {dashboardState === 'report_weight' ? 'AGUARDANDO' : '▼ DADOS SALVOS'}
             </div>
           </div>
           <div className="bg-[#141414] border border-[#222] p-4 flex flex-col justify-between">
             <span className="text-[10px] font-bold text-neutral-500 tracking-widest uppercase italic">META SEMANAL</span>
             <div className="text-4xl md:text-5xl font-black text-white">{weeklyGoal}<span className="text-sm md:text-lg font-normal text-neutral-600 ml-1">KG</span></div>
             <div className="h-1 bg-neutral-800 w-full mt-2"><div className="h-full bg-blue-500 w-[20%]"></div></div>
           </div>
           <div className="bg-[#141414] border border-[#222] p-4 flex flex-col justify-between col-span-2 md:col-span-1">
             <span className="text-[10px] font-bold text-neutral-500 tracking-widest uppercase italic text-left md:text-right">MISSÃO DO DIA</span>
             <div className="text-xl md:text-2xl font-black leading-tight text-white text-left md:text-right mt-2">TREINO DE CHOQUE E DIETA RESTRITA</div>
           </div>
        </div>

        {/* Modules logic based on dashboardState */}
        {dashboardState === 'report_weight' ? (
          <section className="bg-[#141414] border-2 border-orange-600 p-8 md:p-12 mb-8 flex flex-col justify-center items-center shadow-[10px_10px_0px_0px_rgba(234,88,12,0.1)]">
             <h2 className="text-3xl md:text-5xl font-black uppercase text-white mb-4 tracking-tighter text-center">QUAL O SEU PESO MATINAL?</h2>
             <p className="text-neutral-400 mb-8 font-mono text-sm uppercase text-center max-w-lg">
               Insira o seu peso exato. Omitir este dado ou reportar após às 09:00 AM é uma infração tática gravíssima.
             </p>
             <div className="flex gap-4 items-center mb-8">
                  <input 
                    type="number" 
                    step="0.1" 
                    value={currentWeight} 
                    onChange={e => setCurrentWeight(e.target.value)} 
                    placeholder="00.0" 
                    className="w-32 md:w-48 bg-black border border-[#333] p-4 text-center text-white focus:outline-none focus:border-orange-500 font-mono font-black text-4xl md:text-5xl placeholder:text-neutral-700" 
                  />
                  <span className="text-2xl md:text-4xl font-black text-neutral-500">KG</span>
             </div>
             <button 
                onClick={() => {
                  setLastWeightReportDate(todayStr); // Save that they reported today!
                  setDashboardState('active'); // Since they are providing weight, just go active. 
                  // If they were late, they ALREADY saw the infraction and paid it by being forced to the infraction screen first.
                }} 
                disabled={!currentWeight} 
                className="w-full max-w-sm bg-orange-600 hover:bg-orange-500 text-black font-black px-8 py-5 uppercase tracking-tighter transition-colors text-xl disabled:opacity-50 disabled:cursor-not-allowed shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
             >
                 Sincronizar [ENTER]
             </button>
          </section>
        ) : dashboardState === 'infraction' ? (
          <section className="bg-[#1A1A1A] p-6 md:p-12 border-l-4 border-red-600 flex flex-col justify-center relative shadow-[10px_10px_0px_0px_rgba(220,38,38,0.1)]">
            <div className="absolute top-4 right-6 text-[60px] md:text-[100px] opacity-5 font-black italic select-none">09:00</div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-red-500 uppercase leading-none mb-4 tracking-tighter flex items-center gap-3">
              <ShieldAlert className="w-8 h-8 md:w-12 md:h-12" /> INFRAÇÃO MÁXIMA
            </h2>
            <p className="text-neutral-400 mb-8 max-w-2xl text-lg">Você não reportou seu peso até as 09:00 AM e o sistema suspendeu seu acesso temporariamente. Cumpra a punição tática de <strong className="text-white">10 agachamentos</strong> agora mesmo para restabelecer os sistemas.</p>
            
            <div className="flex flex-col md:flex-row gap-4 max-w-2xl">
              <button 
                onClick={() => {
                  setInfractionPaidDate(todayStr);
                  if (lastWeightReportDate !== todayStr) {
                    setDashboardState('report_weight');
                  } else {
                    setDashboardState('active');
                  }
                }}
                className="bg-red-600 hover:bg-red-500 text-white font-black px-8 py-6 uppercase tracking-tighter transition-colors text-xl md:text-2xl flex-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-3 animate-pulse hover:animate-none"
              >
                PAGUEI 10 AGACHAMENTOS [OK]
              </button>
            </div>
          </section>
        ) : (
          <>
            <section className="flex-[2] text-left flex flex-col">
              {/* NAVEGAÇÃO ESTRATÉGICA */}
              <div className="grid grid-cols-3 md:grid-cols-6 text-[10px] md:text-sm font-black uppercase tracking-wider mb-6 border-b border-[#222] w-full bg-[#111]">
                <button 
                  onClick={() => setActiveTab('today')}
                  className={`flex flex-col justify-center items-center py-3 md:py-4 transition-all border-b-2 -mb-[1px] ${
                    activeTab === 'today' 
                      ? 'border-orange-500 text-orange-500 bg-orange-600/10' 
                      : 'border-transparent text-neutral-500 hover:text-white hover:bg-[#1A1A1A]'
                  }`}
                >
                  <span className="hidden md:inline">HOJE (MISSÃO ATUAL)</span>
                  <span className="inline md:hidden">HOJE</span>
                </button>
                <button 
                  onClick={() => setActiveTab('tomorrow')}
                  className={`flex flex-col justify-center items-center py-3 md:py-4 transition-all border-b-2 -mb-[1px] relative ${
                    activeTab === 'tomorrow' 
                      ? 'border-blue-500 text-blue-500 bg-blue-600/10' 
                      : 'border-transparent text-neutral-500 hover:text-white hover:bg-[#1A1A1A]'
                  }`}
                >
                  <div className="flex items-center gap-1.5 md:gap-2">
                    <span className="hidden md:inline">AMANHÃ (RECONHECIMENTO)</span>
                    <span className="inline md:hidden">AMANHÃ</span>
                    {!tomorrowPrepared && <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-red-500 animate-ping"></div>}
                  </div>
                </button>
                <button 
                  onClick={() => setActiveTab('stock')}
                  className={`flex flex-col justify-center items-center py-3 md:py-4 transition-all border-b-2 -mb-[1px] ${
                    activeTab === 'stock' 
                      ? 'border-green-500 text-green-500 bg-green-600/10' 
                      : 'border-transparent text-neutral-500 hover:text-white hover:bg-[#1A1A1A]'
                  }`}
                >
                  <span className="hidden md:inline">ESTOQUE</span>
                  <span className="inline md:hidden">ESTOQUE</span>
                </button>
                <button 
                  onClick={() => setActiveTab('missions')}
                  className={`flex flex-col justify-center items-center py-3 md:py-4 text-center transition-all border-b-2 -mb-[1px] ${
                    activeTab === 'missions' 
                      ? 'border-purple-500 text-purple-500 bg-purple-600/10' 
                      : 'border-transparent text-neutral-500 hover:text-white hover:bg-[#1A1A1A]'
                  }`}
                >
                  <span className="hidden leading-tight md:inline">MISSÕES</span>
                  <span className="inline leading-tight md:hidden">MISSÕES</span>
                </button>
                <button 
                  onClick={() => setActiveTab('scanner')}
                  className={`flex flex-col justify-center items-center py-3 md:py-4 text-center transition-all border-b-2 -mb-[1px] ${
                    activeTab === 'scanner' 
                      ? 'border-yellow-500 text-yellow-500 bg-yellow-600/10' 
                      : 'border-transparent text-neutral-500 hover:text-white hover:bg-[#1A1A1A]'
                  }`}
                >
                  <span className="hidden leading-tight md:inline">SCAN TÁTICO</span>
                  <span className="inline leading-tight md:hidden">SCAN</span>
                </button>
                <button 
                  onClick={() => setActiveTab('academy')}
                  className={`flex flex-col justify-center items-center py-3 md:py-4 text-center transition-all border-b-2 -mb-[1px] ${
                    activeTab === 'academy' 
                      ? 'border-teal-500 text-teal-500 bg-teal-600/10' 
                      : 'border-transparent text-neutral-500 hover:text-white hover:bg-[#1A1A1A]'
                  }`}
                >
                  <span className="hidden leading-tight md:inline">ACADEMIA</span>
                  <span className="inline leading-tight md:hidden">ACADEMIA</span>
                </button>
              </div>

              {(activeTab === 'today' || activeTab === 'tomorrow') && (
                <div className={`bg-[#1A1A1A] border-l-4 ${activeTab === 'today' ? 'border-orange-600 shadow-[4px_4px_0px_0px_rgba(234,88,12,0.15)]' : 'border-blue-600 shadow-[4px_4px_0px_0px_rgba(37,99,235,0.15)]'} p-4 md:p-6 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4`}>
                   <div>
                     <h3 className={`${activeTab === 'today' ? 'text-orange-500' : 'text-blue-500'} font-bold tracking-widest text-[10px] uppercase mb-1`}>// SINCRONIZAÇÃO DO MOTOR TÁTICO</h3>
                     <div className="text-lg md:text-2xl font-black text-white uppercase tracking-tighter flex flex-wrap items-center gap-2">
                       MISSÃO FÍSICA: 
                       <span className={`${activeTab === 'today' ? 'text-orange-500' : 'text-blue-500'} flex items-center relative group`}>
                         <input 
                           type="time" 
                           value={draftTrainingTime}
                           onChange={(e) => setDraftTrainingTime(e.target.value)}
                           style={{ colorScheme: 'dark' }}
                           className={`bg-black border ${activeTab === 'today' ? 'border-orange-600/50 text-orange-500 hover:border-orange-500 focus:border-orange-500' : 'border-blue-600/50 text-blue-500 hover:border-blue-500 focus:border-blue-500'} focus:outline-none transition-colors cursor-text w-[110px] h-[50px] md:w-[130px] md:h-[60px] flex justify-center items-center text-center text-2xl md:text-3xl font-mono [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-datetime-edit]:p-0 [&::-webkit-datetime-edit]:flex [&::-webkit-datetime-edit]:justify-center [&::-webkit-datetime-edit-fields-wrapper]:flex [&::-webkit-datetime-edit-fields-wrapper]:justify-center`}
                         />
                         <span className="absolute -right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                           <Pencil className="w-4 h-4 opacity-50" />
                         </span>
                       </span> 
                       <span className="text-neutral-500 mx-2 md:mx-4">A</span>
                       <span className={`${activeTab === 'today' ? 'text-orange-500' : 'text-blue-500'} flex items-center relative group`}>
                         <input 
                           type="time" 
                           value={draftTrainingEndTime}
                           onChange={(e) => setDraftTrainingEndTime(e.target.value)}
                           style={{ colorScheme: 'dark' }}
                           className={`bg-black border ${activeTab === 'today' ? 'border-orange-600/50 text-orange-500 hover:border-orange-500 focus:border-orange-500' : 'border-blue-600/50 text-blue-500 hover:border-blue-500 focus:border-blue-500'} focus:outline-none transition-colors cursor-text w-[110px] h-[50px] md:w-[130px] md:h-[60px] flex justify-center items-center text-center text-2xl md:text-3xl font-mono [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-datetime-edit]:p-0 [&::-webkit-datetime-edit]:flex [&::-webkit-datetime-edit]:justify-center [&::-webkit-datetime-edit-fields-wrapper]:flex [&::-webkit-datetime-edit-fields-wrapper]:justify-center`}
                         />
                         <span className="absolute -right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                           <Pencil className="w-4 h-4 opacity-50" />
                         </span>
                       </span> 
                       <span className="text-neutral-500 ml-4">— PRONTIDÃO TOTAL</span>
                     </div>
                   </div>
                   {(draftTrainingTime !== trainingTime || draftTrainingEndTime !== trainingEndTime) && (
                     <button
                       onClick={() => {
                         setTrainingTime(draftTrainingTime);
                         setTrainingEndTime(draftTrainingEndTime);
                       }}
                       className={`${activeTab === 'today' ? 'bg-orange-600 hover:bg-orange-500 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'} font-black px-6 py-3 uppercase tracking-tighter text-sm md:text-base w-full md:w-auto shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-colors whitespace-nowrap mt-4 md:mt-0`}
                     >
                       SALVAR RECALIBRAGEM
                     </button>
                   )}
                </div>
              )}

              {activeTab === 'today' && (
                <>
                  <div className="bg-[#141414] border border-[#222] p-6 md:p-8 shadow-[8px_8px_0px_0px_rgba(255,255,255,0.02)] h-full">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                      <h2 className="text-2xl md:text-3xl font-black text-white uppercase leading-none tracking-tighter">
                        LOGÍSTICA NUTRICIONAL <span className="text-neutral-700 text-lg md:text-xl ml-2">/ {new Date().toLocaleDateString('pt-BR', { weekday: 'long' }).split('-')[0].toUpperCase()}</span>
                      </h2>
                      <div className="px-3 py-1 bg-green-900/30 text-green-500 text-[10px] font-bold border border-green-900 uppercase tracking-widest whitespace-nowrap">
                        GEMINI ENGINE: OPTIMIZED
                      </div>
                    </div>
                    <div className="space-y-4">
                      {meals.map((meal) => (
                        <div 
                          key={meal.id} 
                          className={`flex flex-col md:flex-row md:items-center p-4 md:p-5 border-l-4 relative transition-all ${
                            meal.status === 'COMPLETED' ? 'bg-black border-green-500' :
                            meal.status === 'ACTIVE' ? 'bg-[#1A1A1A] border-orange-500 shadow-[4px_4px_0px_0px_rgba(234,88,12,0.1)]' :
                            'bg-black/50 border-[#333] opacity-60 grayscale'
                          }`}
                        >
                          <div className={`w-20 font-mono text-sm font-bold mb-2 md:mb-0 ${
                            meal.status === 'COMPLETED' ? 'text-neutral-500' :
                            meal.status === 'ACTIVE' ? 'text-orange-500' :
                            'text-neutral-600'
                          }`}>
                            {meal.time}
                          </div>
                          <div className="flex-1 mb-3 md:mb-0">
                            <div className={`font-black uppercase tracking-tight text-lg relative inline-block ${
                              meal.status === 'PENDING' ? 'text-neutral-500' : 'text-white'
                            }`}>
                              {meal.name}
                              {meal.status === 'ACTIVE' && (
                                <div className="absolute -top-1 -right-3 w-2 h-2 bg-orange-500 rounded-full animate-ping"></div>
                              )}
                            </div>
                            <div className={`text-sm font-medium mt-1 ${meal.status === 'PENDING' ? 'text-neutral-600' : 'text-neutral-400'}`}>
                              {meal.description}
                            </div>
                          </div>
                          
                          {meal.status === 'COMPLETED' && (
                             <div className="text-green-500 text-sm font-black tracking-widest bg-green-900/20 px-4 py-2 border border-green-900/50 absolute top-4 right-4 md:relative md:top-auto md:right-auto">
                               [OK]
                             </div>
                          )}
                          
                          {meal.status === 'ACTIVE' && (
                            <button 
                              onClick={() => handleMarkCompleted(meal.id)}
                              className="bg-orange-600 hover:bg-orange-500 text-black font-black px-6 py-3 uppercase tracking-tighter transition-colors text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                            >
                              MARCAR CONCLUÍDO
                            </button>
                          )}

                          {meal.status === 'PENDING' && (
                            <div className="text-neutral-600 text-xs font-black tracking-widest uppercase md:absolute md:top-6 md:right-6">
                              PENDENTE
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* WATER AND MOOD TRACKER */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    {/* WATER TRACKER */}
                    <div className="bg-[#141414] border border-[#222] p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      <h3 className="text-blue-500 font-bold tracking-widest text-[10px] uppercase mb-4">// HIDRATAÇÃO (MÓDULO 19)</h3>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-mono text-neutral-400">Progresso de Água</span>
                        <span className="text-sm font-mono text-white font-bold">{waterConsumed} / {Math.floor(parseFloat(currentWeight || initialWeight || '0') * 35)} ml</span>
                      </div>
                      <div className="w-full bg-[#222] h-4 mb-4">
                        <div 
                           className="bg-blue-600 h-full transition-all duration-500" 
                           style={{ width: `${Math.min(100, (waterConsumed / (Math.floor(parseFloat(currentWeight || initialWeight || '0') * 35) || 1)) * 100)}%` }}
                        ></div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setWaterConsumed(w => w + 250)} className="flex-1 bg-[#222] hover:bg-[#333] border border-[#333] text-white text-xs font-bold py-2">+ 250ml</button>
                        <button onClick={() => setWaterConsumed(w => w + 500)} className="flex-1 bg-[#222] hover:bg-[#333] border border-[#333] text-white text-xs font-bold py-2">+ 500ml</button>
                      </div>
                    </div>

                    {/* MOOD TRACKER */}
                    <div className="bg-[#141414] border border-[#222] p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                       <h3 className="text-purple-500 font-bold tracking-widest text-[10px] uppercase mb-4">// DIÁRIO TÁTICO (MÓDULO 17)</h3>
                       {['stress', 'anxiety', 'hunger'].map(metric => (
                          <div key={metric} className="mb-3">
                             <div className="flex justify-between text-xs font-mono text-neutral-400 uppercase mb-1">
                                <span>{metric === 'stress' ? 'Nível de Estresse' : metric === 'anxiety' ? 'Nível de Ansiedade' : 'Vontade de Furar Dieta'}</span>
                                <span className={moodLog[metric as keyof typeof moodLog] > 3 ? 'text-red-500 font-bold' : 'text-white'}>{moodLog[metric as keyof typeof moodLog]} / 5</span>
                             </div>
                             <div className="flex gap-1 h-6">
                               {[1,2,3,4,5].map(v => (
                                 <button 
                                   key={v}
                                   onClick={() => setMoodLog(m => ({ ...m, [metric]: v }))}
                                   className={`flex-1 transition-colors ${moodLog[metric as keyof typeof moodLog] >= v ? (metric === 'hunger' ? 'bg-orange-600' : 'bg-purple-600') : 'bg-[#222] hover:bg-[#333]'}`}
                                 ></button>
                               ))}
                             </div>
                          </div>
                       ))}
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'tomorrow' && (
                <>
                  <div className="bg-[#1A1A1A] border-l-4 border-red-600 p-4 md:p-6 mb-6 shadow-[4px_4px_0px_0px_rgba(220,38,38,0.15)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                     <div className="flex items-center gap-4">
                       <ShieldAlert className="w-8 h-8 text-red-500" />
                       <div>
                         <h3 className="text-red-500 font-bold tracking-widest text-[10px] uppercase mb-1">// ALERTA CRÍTICO: QUEBRA DE SUPRIMENTO</h3>
                         <div className="text-sm font-medium text-white max-w-lg">
                           Atenção! Quebra de suprimento detectada para a missão de amanhã. Adquira <strong className="text-orange-500 uppercase">Peito de Frango</strong> hoje ou recalcule a rota.
                         </div>
                       </div>
                     </div>
                  </div>

                  <div className="bg-[#050A14] border border-[#1A2A40] p-6 md:p-8 shadow-[8px_8px_0px_0px_rgba(59,130,246,0.02)] h-full mb-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                      <h2 className="text-2xl md:text-3xl font-black text-white uppercase leading-none tracking-tighter">
                        ORDEM DO DIA <span className="text-blue-900 text-lg md:text-xl ml-2">/ AMANHÃ</span>
                      </h2>
                      <div className="px-3 py-1 bg-blue-900/30 text-blue-500 text-[10px] font-bold border border-blue-900 uppercase tracking-widest whitespace-nowrap">
                        AQUISIÇÃO E PREPARO
                      </div>
                    </div>
                    <div className="space-y-4">
                      {meals.map((meal) => (
                        <div 
                          key={meal.id} 
                          className="flex flex-col md:flex-row md:items-center p-4 md:p-5 border-l-4 bg-[#0A1220] border-[#1E3A8A] relative transition-all"
                        >
                          <div className="w-20 font-mono text-sm font-bold mb-2 md:mb-0 text-blue-500">
                            {meal.time}
                          </div>
                          <div className="flex-1 mb-3 md:mb-0">
                            <div className="font-black uppercase tracking-tight text-lg relative inline-block text-white">
                              {meal.name}
                            </div>
                            <div className="text-sm font-medium mt-1 text-blue-200">
                              {meal.description}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {tomorrowPrepared ? (
                    <div className="bg-green-900/20 border-2 border-green-500 p-6 flex items-center justify-center gap-3 text-green-500 font-black uppercase text-xl md:text-2xl tracking-tighter">
                      RAÇÕES DE COMBATE SEPARADAS [OK]
                    </div>
                  ) : (
                    <button 
                      onClick={() => setTomorrowPrepared(true)}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-6 uppercase tracking-tighter text-xl md:text-2xl transition-colors flex items-center justify-center gap-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-pulse hover:animate-none"
                    >
                      CIENTE - PREPARAR RAÇÕES AGORA
                    </button>
                  )}
                </>
              )}

              {activeTab === 'stock' && (
                <>
                  <div className="bg-[#0A1A10] border border-[#143320] p-6 md:p-8 shadow-[8px_8px_0px_0px_rgba(34,197,94,0.02)] h-full mb-6 relative overflow-hidden flex flex-col">
                    <h2 className="text-2xl md:text-3xl font-black text-white uppercase leading-none tracking-tighter mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>CENTRAL DE LOGÍSTICA <span className="text-green-900 text-lg md:text-xl ml-2">/ INTENDÊNCIA</span></div>
                      <div className="text-xs font-mono text-green-500 bg-green-500/10 px-2 py-1 rounded inline-flex self-start md:self-auto uppercase tracking-widest border border-green-500/20">
                        SINCRONIZADO: {currentTime}
                      </div>
                    </h2>
                    
                    {/* STOCK SUB-TABS */}
                    <div className="flex border-b border-[#222] mb-6 overflow-x-auto scrollbar-none font-black text-xs md:text-sm uppercase tracking-widest w-full">
                      <button 
                        onClick={() => setStockSubTab('shopping')}
                        className={`flex-1 min-w-[max-content] py-3 px-4 border-b-2 transition-colors ${stockSubTab === 'shopping' ? 'border-green-500 text-green-500 bg-green-900/20' : 'border-transparent text-neutral-500 hover:text-white'}`}
                      >
                        LISTA DE COMPRAS
                      </button>
                      <button 
                        onClick={() => setStockSubTab('inventory')}
                        className={`flex-1 min-w-[max-content] py-3 px-4 border-b-2 transition-colors ${stockSubTab === 'inventory' ? 'border-green-500 text-green-500 bg-green-900/20' : 'border-transparent text-neutral-500 hover:text-white'}`}
                      >
                        RESERVA TÁTICA
                      </button>
                      <button 
                        onClick={() => setStockSubTab('finances')}
                        className={`flex-1 min-w-[max-content] py-3 px-4 border-b-2 transition-colors ${stockSubTab === 'finances' ? 'border-green-500 text-green-500 bg-green-900/20' : 'border-transparent text-neutral-500 hover:text-white'}`}
                      >
                        CUSTO OPERACIONAL
                      </button>
                    </div>

                    <div className="flex-1 flex flex-col bg-black/50 border border-[#143320] p-4 md:p-6 placeholder-panel relative">
                      {/* DRAFT: MOCK DATA UNTIL REAL INTEGRATION IS ADDED */}
                      {stockSubTab === 'shopping' && (
                        <div className="animate-in fade-in zoom-in-95 duration-300">
                          {safeElapsedDays % 7 === 5 && (
                            <div className="bg-[#1A1A1A] border-l-4 border-yellow-500 p-4 mb-6 shadow-[4px_4px_0px_0px_rgba(234,179,8,0.15)] flex flex-col items-start gap-2">
                              <h3 className="text-yellow-500 font-bold tracking-widest text-[10px] uppercase">// ALERTA DE LOGÍSTICA (6º DIA)</h3>
                              <p className="text-sm font-medium text-white">Sua semana tática está chegando ao fim. Avalie o estoque restante e gere a lista para os próximos 7 dias hoje.</p>
                            </div>
                          )}
                          <h3 className="text-green-500 font-black uppercase tracking-widest text-sm mb-4 flex items-center gap-2">
                             <div className={`w-2 h-2 ${isGeneratingShopping ? 'bg-orange-500' : 'bg-green-500'} rounded-full animate-pulse`}></div>
                             LISTA DE COMPRAS (PRÓXIMOS 7 DIAS)
                          </h3>
                          <div className="space-y-2">
                            {shoppingList.length === 0 ? (
                                <div className="p-8 text-center border border-[#222] bg-black text-neutral-600 font-mono text-sm">
                                  NENHUMA LISTA GERADA NO MOMENTO.
                                </div>
                            ) : (
                              <>
                                {shoppingList.map((item) => (
                                  <div key={item.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-3 border border-[#222] bg-black hover:border-green-900 transition-colors gap-3">
                                    <div className="flex-1">
                                      <div className="text-white font-mono text-sm uppercase font-bold">{item.name}</div>
                                      <div className="text-neutral-500 font-mono text-xs">QUANTIDADE SUGERIDA: {item.quantity} {item.unit}</div>
                                    </div>
                                    <div className="flex items-center gap-4 w-full md:w-auto mt-2 md:mt-0">
                                      <label className="flex items-center gap-2 cursor-pointer text-xs font-mono text-neutral-400 whitespace-nowrap">
                                        <input 
                                          type="checkbox" 
                                          checked={item.haveIt || false}
                                          onChange={() => setShoppingList(prev => prev.map(p => p.id === item.id ? { ...p, haveIt: !p.haveIt } : p))}
                                          className="w-4 h-4 accent-green-600 bg-black border-[#333]" 
                                        />
                                        JÁ TENHO
                                      </label>
                                      
                                      <div className="flex items-center gap-2 ml-auto">
                                        <span className="text-neutral-500 font-mono text-xs">R$</span>
                                        <input
                                          type="number"
                                          disabled={item.haveIt}
                                          value={item.price || ''}
                                          onChange={(e) => setShoppingList(prev => prev.map(p => p.id === item.id ? { ...p, price: parseFloat(e.target.value) || 0 } : p))}
                                          className="w-20 md:w-24 bg-[#111] border border-[#333] text-white p-2 text-sm font-mono focus:border-green-500 outline-none disabled:opacity-50"
                                          placeholder="0.00"
                                        />
                                        <span className="text-neutral-600 font-mono text-[10px]">UN/KG</span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                                <div className="mt-6 p-4 md:p-6 bg-[#0a120d] border border-green-900/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                  <div>
                                    <div className="text-green-500 font-black uppercase tracking-widest text-sm mb-1">TOTAL PREVISTO NA ORDEM</div>
                                    <div className="text-neutral-500 font-mono text-xs max-w-sm">O valor abaixo será usado como base para controle de orçamento e subtrai os itens que você já possui no estoque.</div>
                                  </div>
                                  <div className="flex flex-col items-end gap-2 w-full md:w-auto mt-2 md:mt-0">
                                    <span className="font-mono text-3xl md:text-4xl text-white font-black tracking-tighter">
                                      <span className="text-green-500 mr-2">R$</span>
                                      {shoppingList.reduce((acc, curr) => curr.haveIt ? acc : acc + ((curr.price || 0) * curr.quantity), 0).toFixed(2)}
                                    </span>
                                    {shoppingList.reduce((acc, curr) => curr.haveIt ? acc : acc + ((curr.price || 0) * curr.quantity), 0) > 0 && (
                                      <button 
                                        onClick={() => {
                                          const total = shoppingList.reduce((acc, curr) => curr.haveIt ? acc : acc + ((curr.price || 0) * curr.quantity), 0);
                                          setWeeklySpent(prev => prev + total);
                                          setMonthlySpent(prev => prev + total);
                                          setInvoiceAmount('');
                                          setStockSubTab('finances');
                                        }}
                                        className="text-xs font-black uppercase tracking-widest bg-green-500 text-black px-4 py-2 hover:bg-green-400 mt-2 transition-colors w-full md:w-auto"
                                      >
                                        LANÇAR NO CUSTO OPERACIONAL
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                          <div className="flex flex-col md:flex-row gap-4 mt-4">
                            <button 
                              onClick={generateShoppingList}
                              disabled={isGeneratingShopping}
                              className="flex-1 py-4 bg-green-900/20 hover:bg-green-900/40 border border-green-500/50 text-green-500 font-black uppercase tracking-widest transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                              {isGeneratingShopping ? 'PROCESSANDO VIA ENGINE...' : 'GERAR NOVA LISTA'}
                            </button>
                            {shoppingList.length > 0 && (
                              <button 
                                onClick={() => {
                                  let text = `*ORDEM DE SUPRIMENTOS - LOGÍSTICA TÁTICA*\n\n`;
                                  const toBuyList = shoppingList.filter(i => !i.haveIt);
                                  if (toBuyList.length === 0) {
                                    alert("Todos os itens já constam no estoque.");
                                    return;
                                  }
                                  toBuyList.forEach(item => {
                                    text += `• ${item.quantity} ${item.unit} de *${item.name}*\n`;
                                  });
                                  text += `\n_Gerado por ChoqueFit Control_`;
                                  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                                }}
                                className="flex-1 py-4 bg-[#25D366]/20 hover:bg-[#25D366]/30 border border-[#25D366]/50 text-[#25D366] font-black uppercase tracking-widest transition-colors">
                                ENVIAR P/ WHATSAPP
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {stockSubTab === 'inventory' && (
                        <div className="animate-in fade-in zoom-in-95 duration-300">
                          <h3 className="text-green-500 font-black uppercase tracking-widest text-sm mb-4">RESERVA TÁTICA</h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {inventory.map((inv, i) => (
                              <div key={i} className="p-4 border border-[#222] bg-black flex flex-col justify-between h-24">
                                <div className="text-xs text-neutral-500 uppercase font-bold tracking-widest">{inv.name} {inv.icon}</div>
                                <div className={`text-xl font-black ${inv.quantity === 0 ? 'text-red-500' : 'text-white'}`}>{inv.quantity === 0 ? 'BAIXO' : `${inv.unit === 'kg' ? inv.quantity.toFixed(2) : inv.quantity} ${inv.unit}`}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {stockSubTab === 'finances' && (
                        <div className="animate-in fade-in zoom-in-95 duration-300">
                          <h3 className="text-green-500 font-black uppercase tracking-widest text-sm mb-4">CONTROLE DE ORÇAMENTO</h3>
                          <div className="flex flex-col md:flex-row gap-4 mb-6">
                            <div className="flex-1 p-4 md:p-6 border border-[#222] bg-black">
                               <div className="text-xs text-neutral-500 uppercase font-black mb-2 tracking-widest">GASTO SEMANAL</div>
                               <div className="text-3xl md:text-4xl text-white font-black tracking-tighter">R$ {weeklySpent.toFixed(2).replace('.', ',')}</div>
                            </div>
                            <div className="flex-1 p-4 md:p-6 border border-[#222] bg-black">
                               <div className="text-xs text-neutral-500 uppercase font-black mb-2 tracking-widest">GASTO MENSAL</div>
                               <div className="text-3xl md:text-4xl text-white font-black tracking-tighter">R$ {monthlySpent.toFixed(2).replace('.', ',')}</div>
                            </div>
                          </div>
                          
                          <div className="border-t border-[#222] pt-6 uppercase">
                            <div className="text-xs text-neutral-400 font-black tracking-widest mb-4">LANÇAR NOTA FISCAL (MERCADO)</div>
                            <div className="flex gap-2">
                               <input 
                                 type="number" 
                                 placeholder="R$ 0,00" 
                                 value={invoiceAmount}
                                 onChange={(e) => setInvoiceAmount(e.target.value)}
                                 style={{ colorScheme: 'dark' }} 
                                 className="flex-1 bg-black border border-[#333] p-3 md:p-4 text-white font-mono focus:border-green-500 focus:outline-none" 
                               />
                               <button 
                                 onClick={() => {
                                    const val = parseFloat(invoiceAmount);
                                    if (!isNaN(val) && val > 0) {
                                       setWeeklySpent(prev => prev + val);
                                       setMonthlySpent(prev => prev + val);
                                       setInvoiceAmount('');
                                    }
                                 }}
                                 className="bg-green-600 hover:bg-green-500 text-white font-black px-6 py-3 tracking-tighter transition-colors">
                                 REGISTRAR
                               </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'missions' && (
                <>
                  <div className="bg-[#1A1025] border border-[#2F1D46] p-6 md:p-8 shadow-[8px_8px_0px_0px_rgba(168,85,247,0.02)] h-full mb-6 relative overflow-hidden">
                    <h2 className="text-2xl md:text-3xl font-black text-white uppercase leading-none tracking-tighter mb-4 flex items-center justify-between">
                      <div>ESTADO DAS MISSÕES <span className="text-purple-900 text-lg md:text-xl ml-2">/ PROGRESSO</span></div>
                      <div className="text-xs font-mono text-purple-500 bg-purple-500/10 px-2 py-1 rounded">EM DESENVOLVIMENTO</div>
                    </h2>
                     <div className="space-y-4 mt-8">
                       {[1, 2, 3].map(i => (
                         <div key={i} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 border border-[#222] bg-black gap-4">
                           <div>
                             <div className="font-black text-white text-lg">MISSÃO COBERTURA #{i}</div>
                             <div className="text-neutral-500 text-sm">Status da operação indefinido.</div>
                           </div>
                           <div className="text-neutral-700 font-black">BLOQUEADO</div>
                         </div>
                       ))}
                     </div>
                  </div>
                </>
              )}

              {activeTab === 'scanner' && (
                <>
                  <div className="bg-[#141414] border border-[#222] p-6 md:p-8 shadow-[8px_8px_0px_0px_rgba(234,179,8,0.02)] h-full mb-6">
                    <h2 className="text-2xl md:text-3xl font-black text-yellow-500 uppercase leading-none tracking-tighter mb-4 flex items-center justify-between">
                      <div>SCANNER DE REFEIÇÃO <span className="text-yellow-900 text-lg md:text-xl ml-2">/ MÓDULO 16</span></div>
                    </h2>
                    <p className="text-neutral-400 font-mono text-sm mb-6">Inteligência Tática (Gemini Vision) para análise de macronutrientes.</p>
                    
                    <div className="border border-[#333] border-dashed p-8 bg-black flex flex-col items-center justify-center text-center relative overflow-hidden transition-colors hover:border-yellow-500/50">
                       <input 
                         type="file" 
                         accept="image/*" 
                         capture="environment"
                         className="absolute inset-0 opacity-0 cursor-pointer z-10"
                         onChange={async (e) => {
                           const file = e.target.files?.[0];
                           if (!file) return;
                           setIsScanning(true);
                           const reader = new FileReader();
                           reader.onload = async (ev) => {
                              const base64 = (ev.target?.result as string).split(',')[1];
                              try {
                                const res = await fetch('/api/vision/meal-scanner', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ imageBase64: base64, mimeType: file.type })
                                });
                                const data = await res.json();
                                setScanResult(data);
                              } catch(e) {
                                console.error(e);
                              } finally {
                                setIsScanning(false);
                              }
                           }
                           reader.readAsDataURL(file);
                         }}
                       />
                       {isScanning ? (
                         <div className="text-yellow-500 font-black animate-pulse uppercase tracking-widest text-lg">
                           ANALISANDO REFEIÇÃO... [GEMINI VISION V2]
                         </div>
                       ) : scanResult ? (
                         <div className="w-full text-left relative z-20 pointer-events-none">
                           <div className="text-2xl font-black text-white mb-2 uppercase">{scanResult.name}</div>
                           <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                              <div className="border border-[#222] bg-[#111] p-3">
                                <div className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest mb-1">Calorias</div>
                                <div className="text-xl font-bold text-white">{scanResult.calories} kcal</div>
                              </div>
                              <div className="border border-[#222] bg-[#111] p-3">
                                <div className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest mb-1">Proteínas</div>
                                <div className="text-xl font-bold text-white">{scanResult.protein}g</div>
                              </div>
                              <div className="border border-[#222] bg-[#111] p-3">
                                <div className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest mb-1">Carbos</div>
                                <div className="text-xl font-bold text-white">{scanResult.carbs}g</div>
                              </div>
                              <div className="border border-[#222] bg-[#111] p-3">
                                <div className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest mb-1">Gorduras</div>
                                <div className="text-xl font-bold text-white">{scanResult.fats}g</div>
                              </div>
                           </div>
                           <div className={`p-4 font-mono text-sm font-bold uppercase mb-4 ${scanResult.isApproved ? 'bg-green-900/20 text-green-500 border border-green-900/50' : 'bg-red-900/20 text-red-500 border border-red-900/50'}`}>
                             VEREDITO: {scanResult.isApproved ? 'REFEIÇÃO LIMPA APROVADA' : 'LIXO NÃO AUTORIZADO'}
                           </div>
                           <div className="text-neutral-300 italic text-sm border-l-2 border-yellow-500 pl-4 py-2 bg-[#111]">
                             "{scanResult.feedback}"
                           </div>
                           <div className="pointer-events-auto mt-6 text-center">
                             <button onClick={() => setScanResult(null)} className="text-xs text-yellow-500 hover:text-yellow-400 font-bold uppercase tracking-widest border-b border-yellow-500/30">ESCANEAR NOVO PRATO</button>
                           </div>
                         </div>
                       ) : (
                         <>
                           <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mb-4">
                             <div className="w-8 h-8 rounded-full border-2 border-yellow-500 animate-ping"></div>
                           </div>
                           <div className="text-white font-black uppercase tracking-widest text-lg mb-2 z-20">TIRAR FOTO DO PRATO</div>
                           <div className="text-neutral-500 font-mono text-xs max-w-xs z-20">
                             Toque aqui para capturar a refeição. A IA validará se a refeição condiz com sua missão e patente atual.
                           </div>
                         </>
                       )}
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'academy' && (
                <>
                  <div className="bg-[#141A25] border border-[#1D2F46] p-6 md:p-8 shadow-[8px_8px_0px_0px_rgba(20,184,166,0.02)] h-full mb-6 relative overflow-hidden">
                    <h2 className="text-2xl md:text-3xl font-black text-teal-500 uppercase leading-none tracking-tighter mb-4 flex items-center justify-between">
                      <div>ACADEMIA DE TREINOS <span className="text-teal-900 text-lg md:text-xl ml-2">/ MÓDULO 20</span></div>
                    </h2>
                    <p className="text-neutral-400 font-mono text-sm mb-6">Rotinas de treinamento físico (não dependa de apps externos).</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="bg-black border border-[#222] p-6 hover:border-teal-500/50 transition-colors cursor-pointer group">
                         <div className="text-xs text-teal-500 font-bold tracking-widest uppercase mb-2">// CATEGORIA 01</div>
                         <div className="text-xl font-black text-white uppercase tracking-tighter mb-2 group-hover:text-teal-400 transition-colors">OPERAÇÃO: CASA FORTE</div>
                         <div className="text-sm text-neutral-500 mb-4">Treinamento com peso corporal (Calistenia). Foco em flexões, agachamentos e core. 45 min.</div>
                         <div className="text-[10px] font-mono font-bold px-2 py-1 bg-[#111] inline-block text-neutral-400">INICIANTE / INTERMEDIÁRIO</div>
                       </div>
                       <div className="bg-black border border-[#222] p-6 hover:border-teal-500/50 transition-colors cursor-pointer group">
                         <div className="text-xs text-teal-500 font-bold tracking-widest uppercase mb-2">// CATEGORIA 02</div>
                         <div className="text-xl font-black text-white uppercase tracking-tighter mb-2 group-hover:text-teal-400 transition-colors">OPERAÇÃO: FERRO FRIO</div>
                         <div className="text-sm text-neutral-500 mb-4">Rotina completa de hipertrofia em academia. Abordagem tática para aumento de força. 60 min.</div>
                         <div className="text-[10px] font-mono font-bold px-2 py-1 bg-[#111] inline-block text-neutral-400">TODOS OS NÍVEIS</div>
                       </div>
                    </div>
                  </div>
                </>
              )}
            </section>

            <footer className="mt-8 flex flex-col md:flex-row justify-between items-center py-6 border-t-2 border-[#1A1A1A] gap-6">
              <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
                <button className="text-xs font-black text-neutral-500 hover:text-white flex items-center gap-2 uppercase tracking-widest transition-colors">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-[pulse_2s_ease-in-out_infinite]"></div> MODO VIAGEM
                </button>
                <button className="text-xs font-black text-neutral-500 hover:text-white uppercase tracking-widest transition-colors">FOLGA SOCIAL</button>
                <button 
                  onClick={async () => {
                     await supabase?.auth.signOut();
                     localStorage.removeItem('choqueFitState_v1');
                     window.location.reload();
                  }}
                  className="text-xs font-black text-red-500 hover:text-red-400 uppercase tracking-widest transition-colors"
                >
                  DESCONECTAR
                </button>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 text-[10px] font-mono text-neutral-600 font-bold tracking-widest">
                <div className="flex items-center gap-2 uppercase"><div className="w-1 h-1 bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]"></div> SUPABASE RLS ACTIVE</div>
                <div className="flex items-center gap-2 uppercase"><div className="w-1 h-1 bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]"></div> AI ENGINE: READY</div>
              </div>
            </footer>
          </>
        )}

      </div>
    </main>
  );
}
