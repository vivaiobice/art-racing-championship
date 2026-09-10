function fallbackDriver(id,number,name,psn,country,flag,category,team){return {id,number,name,psn,country,flag,category,team,active:true,points:0,grossPoints:0,discardPoints:0,discardedRound:null,rounds:[],races:0,wins:0,seconds:0,thirds:0,placements:{},ranking:null,poles:0,fastest:0,bestResult:"—",gr3Points:0,gr4Points:0,gr3Races:0,gr4Races:0,lastResult:"—",qualBest:"—",absences:0};}
const FALLBACK_DRIVERS=[
  fallbackDriver("nano94",2,"Nano94","AdamantionX94","Italia","🇮🇹","MASTER","Porsche"),
  fallbackDriver("lele",4,"LELE","Lele_0489","Svizzera","🇨🇭","JUNIOR","Mercedes"),
  fallbackDriver("pablito75",5,"PABLITO75","SPARTAN-den","Italia","🇮🇹","JUNIOR","Porsche"),
  fallbackDriver("avallone92",9,"AVALLONE92","il_Pazzo_ita","Italia","🇮🇹","JUNIOR","Porsche"),
  fallbackDriver("gaegae17",12,"GAEGAE17","GAEGAE17","Regno Unito","🇬🇧","JUNIOR","Porsche"),
  fallbackDriver("eiden",15,"EIDEN","xiimeet","Spagna","🇪🇸","JUNIOR","Nissan"),
  fallbackDriver("cldc",25,"CLDC","CLDC86","Regno Unito","🇬🇧","JUNIOR","Ferrari"),
  fallbackDriver("energymauri",27,"ENERGYMAURI","Energymauri_76","Italia","🇮🇹","MASTER","Ferrari"),
  fallbackDriver("gabry",34,"GABRY","GABRY_thecat_","Italia","🇮🇹","MASTER","Nissan"),
  fallbackDriver("skizzo",35,"SKIZZO","lele2302","Italia","🇮🇹","JUNIOR","Mercedes"),
  fallbackDriver("calibra63",63,"CALIBRA63","Calibraenzo","Italia","🇮🇹","MASTER","Porsche"),
  fallbackDriver("joseph",66,"JOSEPH","joseph666401","Italia","🇮🇹","MASTER","Toyota"),
  fallbackDriver("sovrano",68,"SOVRANO","Sovrano_gt","Italia","🇮🇹","MASTER","Mercedes"),
  fallbackDriver("ivisich",72,"IVISICH","IVISICH","Italia","🇮🇹","MASTER","Ferrari"),
  fallbackDriver("gio",76,"GIO","RoSiK-n-Sil3Nc3","Italia","🇮🇹","MASTER","Porsche"),
  fallbackDriver("zyx",77,"ZYX","zyx_977","Italia","🇮🇹","MASTER","Nissan"),
  fallbackDriver("yannis",78,"YANNIS","YANNIS_SD","Spagna","🇪🇸","JUNIOR","Porsche"),
  fallbackDriver("fax86",86,"FAX","Fax-86","Italia","🇮🇹","MASTER","Porsche"),
  fallbackDriver("ivan",88,"IVAN","IvanFiammaNera","Italia","🇮🇹","JUNIOR","Ferrari"),
  fallbackDriver("fra",95,"FRA","Francesco-Lepera","Italia","🇮🇹","JUNIOR","Porsche")
];
const RACES=[
  {n:1,c:"Autodromo Nazionale Monza",short:"Monza",key:"monza",flag:"🇮🇹",cat:"GR3",date:"2026-09-11T21:45:00+02:00",laps:18,qual:10,fuel:3,tyres:4,weather:"Non indicato",heroImage:"assets/circuits/monza.webp"},
  {n:2,c:"Spa-Francorchamps",short:"Spa-Francorchamps",key:"spa",flag:"🇧🇪",cat:"GR3",date:"2026-09-18T21:45:00+02:00",laps:14,qual:10,fuel:3,tyres:3,weather:"Probabile pioggia",heroImage:"assets/circuits/spa.webp"},
  {n:3,c:"Nürburgring GP",short:"Nürburgring GP",key:"nurburgring",flag:"🇩🇪",cat:"GR3",date:"2026-09-25T21:45:00+02:00",laps:16,qual:10,fuel:3,tyres:4,weather:"Non indicato",heroImage:"assets/circuits/nurburgring.webp"},
  {n:4,c:"Red Bull Ring",short:"Red Bull Ring",key:"redbull",flag:"🇦🇹",cat:"GR3",date:"2026-10-02T21:45:00+02:00",laps:22,qual:10,fuel:3,tyres:5,weather:"Probabile pioggia",heroImage:"assets/circuits/redbull.webp"},
  {n:5,c:"Suzuka",short:"Suzuka",key:"suzuka",flag:"🇯🇵",cat:"GR3",date:"2026-10-09T21:45:00+02:00",laps:15,qual:10,fuel:3,tyres:4,weather:"Non indicato",heroImage:"assets/circuits/suzuka.webp"},
  {n:6,c:"Autodromo Nazionale Monza",short:"Monza",key:"monza",flag:"🇮🇹",cat:"GR4",date:"2026-10-16T21:45:00+02:00",laps:16,qual:10,fuel:2,tyres:3,weather:"Non indicato",heroImage:"assets/circuits/monza.webp"},
  {n:7,c:"Spa-Francorchamps",short:"Spa-Francorchamps",key:"spa",flag:"🇧🇪",cat:"GR4",date:"2026-10-23T21:45:00+02:00",laps:12,qual:10,fuel:2,tyres:2,weather:"Probabile pioggia",heroImage:"assets/circuits/spa.webp"},
  {n:8,c:"Nürburgring GP",short:"Nürburgring GP",key:"nurburgring",flag:"🇩🇪",cat:"GR4",date:"2026-10-30T21:45:00+01:00",laps:14,qual:10,fuel:2,tyres:3,weather:"Non indicato",heroImage:"assets/circuits/nurburgring.webp"},
  {n:9,c:"Red Bull Ring",short:"Red Bull Ring",key:"redbull",flag:"🇦🇹",cat:"GR4",date:"2026-11-06T21:45:00+01:00",laps:19,qual:10,fuel:2,tyres:3,weather:"Probabile pioggia",heroImage:"assets/circuits/redbull.webp"},
  {n:10,c:"Suzuka",short:"Suzuka",key:"suzuka",flag:"🇯🇵",cat:"GR4",date:"2026-11-13T21:45:00+01:00",laps:13,qual:10,fuel:2,tyres:3,weather:"Non indicato",heroImage:"assets/circuits/suzuka.webp"}
];
const LOBBY_SECTIONS=[
  {title:"Impostazione Qualifica",items:[["Tempo limite",r=>`${r.qual} min`],["Tempo qualifica","180 sec"],["Consumi","NO"],["Scia","NO"]]},
  {title:"Impostazione Gara",items:[["Accesso lobby","Solo Amici"],["Modalità","Gara Amichevole"],["Partecipanti max","16"],["Tipo di partenza","Da griglia con falsa partenza"],["Ordine griglia","Pole al più veloce"],["BoP","Attivo"],["Bilanciamento freni","Sì"],["Deportanza","Sì"],["Turbo","Disattivato"],["Intensità scia","Realistica"],["Danni visibili","Sì"],["Danni meccanici","Ridotti"],["Aderenza fuori pista","Realistica"],["Tempo completamento","180 sec"],["Nitro","Proibito"],["Minimo box","1 stop"]]},
  {title:"Gomme & Carburante",items:[["Numero giri",r=>String(r.laps)],["Consumo carburante",r=>`×${r.fuel}`],["Usura gomme",r=>`×${r.tyres}`],["Carburante iniziale","100%"],["Velocità rifornimento","5 L/sec"],["Gomme utilizzabili","Da corsa, tutti i tipi"],["Gomme obbligatorie","Corsa Morbide e Corsa Medie"]]},
  {title:"Penalità & Regole",items:[["Taglio tracciato","Debole"],["Collisione muretto","NO"],["Correzione post-muretto","NO"],["Collisione vettura","Sì"],["Taglio corsia box","Sì"],["Trasparenza","NO"],["Regole bandiere","Sì"]]},
  {title:"Assistenze",items:[["Controsterzo","Proibito"],["Controllo stabilità","Proibito"],["Traiettoria assistita","Nessun limite"],["Controllo trazione","Nessun limite"],["ABS","Nessun limite"],["Pilota automatico","NO"]]}
];
const LOCAL_DATA={piloti:FALLBACK_DRIVERS,gare:RACES,qualifiche:[],risultati:[],classifiche:[],config:{}};
globalThis.ART_LOCAL_DATA=LOCAL_DATA;
