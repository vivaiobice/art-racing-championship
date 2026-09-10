(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.ARTLiveData=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";

  const PUBLIC_ID="2PACX-1vQA-2SDO_zKG6HIBYF5assTudawdI02Bf46HDmheh7_uz3o35QCFlbul6yJR-FkXtIxKnIL9ApFYy6R";
  const GIDS={piloti:"1295515495",gare:"994282550",qualifiche:"424528801",risultati:"1776540083",classifiche:"1147332322",config:"1843954475"};
  const ENDPOINTS=Object.fromEntries(Object.entries(GIDS).map(([name,gid])=>[name,`https://docs.google.com/spreadsheets/d/e/${PUBLIC_ID}/pub?gid=${gid}&single=true&output=csv`]));
  const EXPECTED_HEADERS={piloti:"ID",gare:"GARA",qualifiche:"GARA",risultati:"GARA",classifiche:"POS",config:"CHIAVE"};
  const COUNTRIES={IT:["Italia","🇮🇹"],CH:["Svizzera","🇨🇭"],GB:["Regno Unito","🇬🇧"],ES:["Spagna","🇪🇸"],BE:["Belgio","🇧🇪"],DE:["Germania","🇩🇪"],AT:["Austria","🇦🇹"],JP:["Giappone","🇯🇵"]};
  const TRACKS={monza:"monza",spa:"spa",nürburgring:"nurburgring",nurburgring:"nurburgring","red bull ring":"redbull",suzuka:"suzuka","suzuka circuit":"suzuka"};

  function parseCSV(text){
    const rows=[];let row=[],field="",quoted=false;
    const source=String(text||"").replace(/^\uFEFF/,"");
    for(let i=0;i<source.length;i++){
      const ch=source[i];
      if(quoted){
        if(ch==='"'&&source[i+1]==='"'){field+='"';i++;}
        else if(ch==='"')quoted=false;
        else field+=ch;
      }else if(ch==='"')quoted=true;
      else if(ch===','){row.push(field);field="";}
      else if(ch==='\n'){row.push(field);rows.push(row);row=[];field="";}
      else if(ch!=='\r')field+=ch;
    }
    if(field!==""||row.length){row.push(field);rows.push(row);}
    const nonEmpty=rows.filter(cells=>cells.some(cell=>cell!==""));
    if(!nonEmpty.length)return [];
    const headers=nonEmpty[0].map(header=>header.trim());
    return nonEmpty.slice(1).map(cells=>Object.fromEntries(headers.map((header,index)=>[header,cells[index]??""])));
  }

  function normalizeNumber(value){
    if(value===null||value===undefined||String(value).trim()==="")return null;
    const parsed=Number(String(value).trim().replace(",","."));
    return Number.isFinite(parsed)?parsed:null;
  }

  function normalizeBoolean(value){
    if(value===true||value===false)return value;
    const normalized=String(value??"").trim().toUpperCase();
    if(["TRUE","VERO","SI","SÌ","1"].includes(normalized))return true;
    if(["FALSE","FALSO","NO","0"].includes(normalized))return false;
    return null;
  }

  function country(code){return COUNTRIES[String(code||"").trim().toUpperCase()]||[String(code||""),"🏁"];}
  function circuitKey(name){const clean=String(name||"").trim().toLowerCase();return TRACKS[clean]||clean.normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"");}
  function heroImage(value){const path=String(value||"").trim();return /^assets\/circuits\/[a-z0-9_-]+\.(?:avif|webp|jpe?g|png)$/i.test(path)?path:null;}
  function category(value){return String(value||"").toUpperCase().replace(".","");}
  function raceDate(date,time){const offset=String(date)>= "2026-10-25"?"+01:00":"+02:00";return `${date}T${time}:00${offset}`;}
  function emptyStats(){return {points:0,races:0,wins:0,seconds:0,thirds:0,ranking:null,poles:0,fastest:0,bestResult:"—",gr3Points:0,gr4Points:0,gr3Races:0,gr4Races:0,lastResult:"—",qualBest:"—",absences:0};}

  function mapPiloti(rows){return rows.filter(row=>normalizeBoolean(row.ATTIVO)!==false).map(row=>{const [countryName,flag]=country(row.PAESE);return {id:String(row.ID||"").trim().toLowerCase(),number:normalizeNumber(row["N°"]),name:String(row.PILOTA||"").trim(),psn:String(row.PSN||"").trim(),country:countryName,flag,category:category(row.CATEGORIA),team:String(row.SCUDERIA||"").trim()||null,active:true,...emptyStats()};}).filter(driver=>driver.id&&driver.number!==null&&driver.name);}
  function mapGare(rows){return rows.map(row=>{const key=circuitKey(row.CIRCUITO),rain=normalizeBoolean(row.PIOGGIA_POSSIBILE);return {n:normalizeNumber(row.GARA),c:String(row.CIRCUITO||"").trim(),short:String(row.CIRCUITO||"").trim(),key,flag:country(row.PAESE)[1],cat:category(row.CLASSE),date:raceDate(row.DATA,row.ORA),laps:normalizeNumber(row.GIRI),qual:normalizeNumber(row.QUALIFICA_MIN),fuel:normalizeNumber(row.CARBURANTE_X),tyres:normalizeNumber(row.GOMME_X),weather:rain?"Probabile pioggia":"Non indicato",status:String(row.STATO||"").trim(),heroImage:heroImage(row.HERO_IMAGE)};}).filter(race=>race.n!==null&&race.c);}
  function allowed(row,ids){return !ids||ids.has(String(row.PILOTA_ID||"").trim().toLowerCase());}
  function mapQualifiche(rows,ids){return rows.filter(row=>allowed(row,ids)).map(row=>({race:normalizeNumber(row.GARA),pos:normalizeNumber(row.POS),driverId:String(row.PILOTA_ID||"").trim().toLowerCase(),time:String(row.TEMPO||"").trim(),pole:normalizeBoolean(row.POLE)===true,note:String(row.NOTE||"").trim()})).filter(item=>item.race!==null&&item.driverId);}
  function mapRisultati(rows,ids){return rows.filter(row=>allowed(row,ids)).map(row=>({race:normalizeNumber(row.GARA),pos:normalizeNumber(row.POS),driverId:String(row.PILOTA_ID||"").trim().toLowerCase(),result:String(row.TEMPO_DISTACCO||"").trim(),fastest:normalizeBoolean(row.GIRO_VELOCE)===true,penalty:normalizeNumber(row.PENALITA_SEC)||0,present:normalizeBoolean(row.PRESENTE)!==false,basePoints:normalizeNumber(row.PUNTI_BASE)||0,poleBonus:normalizeNumber(row.BONUS_POLE)||0,fastestBonus:normalizeNumber(row.BONUS_GV)||0,points:normalizeNumber(row.PUNTI_TOTALI)||0,note:String(row.NOTE||"").trim()})).filter(item=>item.race!==null&&item.driverId);}
  function mapClassifiche(rows,ids){return rows.filter(row=>allowed(row,ids)).map(row=>({pos:normalizeNumber(row.POS),driverId:String(row.PILOTA_ID||"").trim().toLowerCase(),name:String(row.PILOTA||"").trim(),category:category(row.CATEGORIA),team:String(row.SCUDERIA||"").trim()||null,points:normalizeNumber(row.PUNTI)||0,races:normalizeNumber(row.GARE)||0,wins:normalizeNumber(row.VITTORIE)||0,podiums:normalizeNumber(row.PODI)||0,poles:normalizeNumber(row.POLE)||0,fastest:normalizeNumber(row.GIRI_VELOCI)||0,absences:normalizeNumber(row.ASSENZE)||0})).filter(item=>item.driverId);}
  function mapConfig(rows){const result={};for(const row of rows){const key=String(row.CHIAVE||"").trim();if(!key)continue;const raw=String(row.VALORE??"").trim(),bool=normalizeBoolean(raw),number=normalizeNumber(raw);result[key]=raw.includes(",")?raw:bool!==null?bool:number!==null?number:raw;}return result;}

  function applyStats(piloti,gare,qualifiche,risultati,classifiche){
    const byId=new Map(piloti.map(driver=>[driver.id,{...driver,...emptyStats()}]));
    for(const result of risultati){const driver=byId.get(result.driverId);if(!driver)continue;if(result.present)driver.races++;driver.points+=result.points;if(result.pos===1)driver.wins++;if(result.pos===2)driver.seconds++;if(result.pos===3)driver.thirds++;if(result.fastest)driver.fastest++;if(result.pos&&result.pos<=3)driver.bestResult=driver.bestResult==="—"?`${result.pos}°`:driver.bestResult;driver.lastResult=result.present?(result.pos?`${result.pos}°`:"Classificato"):"Assente";const race=gare.find(item=>item.n===result.race);if(race){const key=race.cat==="GR3"?"gr3":"gr4";driver[`${key}Points`]+=result.points;if(result.present)driver[`${key}Races`]++;}}
    for(const qual of qualifiche){const driver=byId.get(qual.driverId);if(!driver)continue;if(qual.pole)driver.poles++;if(qual.time)driver.qualBest=driver.qualBest==="—"?qual.time:driver.qualBest;}
    if(classifiche.length)for(const standing of classifiche){const driver=byId.get(standing.driverId);if(!driver)continue;Object.assign(driver,{points:standing.points,races:standing.races,wins:standing.wins,poles:standing.poles,fastest:standing.fastest,absences:standing.absences,ranking:standing.pos});}
    const sorted=[...byId.values()].sort((a,b)=>b.points-a.points||b.wins-a.wins||b.seconds-a.seconds||b.thirds-a.thirds||a.number-b.number);
    sorted.forEach((driver,index)=>{if(driver.ranking===null&&driver.points>0)driver.ranking=index+1;});
    return piloti.map(driver=>byId.get(driver.id));
  }

  function browserFallback(){const root=typeof globalThis!=="undefined"?globalThis:{};return root.ART_LOCAL_DATA||{piloti:[],gare:[],qualifiche:[],risultati:[],classifiche:[],config:{}};}
  function createClient(options={}){
    const fallback=options.fallback||browserFallback(),fetchImpl=options.fetchImpl||(typeof fetch==="function"?fetch.bind(globalThis):null),cache={};
    async function rowsFor(name){
      if(!fetchImpl)throw new Error("Fetch non disponibile");
      const response=await fetchImpl(ENDPOINTS[name],{cache:"no-store"});
      if(!response||!response.ok)throw new Error(`HTTP ${response&&response.status}`);
      const text=await response.text(),rows=parseCSV(text),firstHeader=String(text).replace(/^\uFEFF/,"").split(/,|\r?\n/,1)[0].trim();
      if(firstHeader!==EXPECTED_HEADERS[name])throw new Error("CSV non valido");
      return rows;
    }
    function once(name,loader){if(!cache[name])cache[name]=loader().catch(()=>fallback[name]??(name==="config"?{}:[]));return cache[name];}
    const client={
      getPiloti:()=>once("piloti",async()=>mapPiloti(await rowsFor("piloti"))),
      getGare:()=>once("gare",async()=>mapGare(await rowsFor("gare"))),
      getQualifiche:()=>once("qualifiche",async()=>{const ids=new Set((await client.getPiloti()).map(item=>item.id));return mapQualifiche(await rowsFor("qualifiche"),ids);}),
      getRisultati:()=>once("risultati",async()=>{const ids=new Set((await client.getPiloti()).map(item=>item.id));return mapRisultati(await rowsFor("risultati"),ids);}),
      getClassifiche:()=>once("classifiche",async()=>{const ids=new Set((await client.getPiloti()).map(item=>item.id));return mapClassifiche(await rowsFor("classifiche"),ids);}),
      getConfig:()=>once("config",async()=>mapConfig(await rowsFor("config")))
    };
    client.getAll=async()=>{const [piloti,gare,qualifiche,risultati,classifiche,config]=await Promise.all([client.getPiloti(),client.getGare(),client.getQualifiche(),client.getRisultati(),client.getClassifiche(),client.getConfig()]);return {piloti:applyStats(piloti,gare,qualifiche,risultati,classifiche),gare,qualifiche,risultati,classifiche,config};};
    return client;
  }

  const defaultClient=createClient();
  return {PUBLIC_ID,GIDS,ENDPOINTS,parseCSV,normalizeNumber,normalizeBoolean,mapPiloti,mapGare,mapQualifiche,mapRisultati,mapClassifiche,mapConfig,applyStats,createClient,...defaultClient};
});
