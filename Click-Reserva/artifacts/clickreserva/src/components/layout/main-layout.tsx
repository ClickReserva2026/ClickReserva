{/* CONTAINER DA LOGO NA TELA DE LOGIN */}
<div className="w-full max-w-[240px] bg-emerald-800 rounded-xl p-4 mb-6 flex flex-col items-center justify-center shadow-sm gap-3">
  {/* Imagem do Logo/Ícone principal */}
  <img 
    src={`${base}/clickreserva_final2.svg`} 
    alt="ClickReserva" 
    className="h-12 w-auto object-contain"
  />
  
  {/* Linha divisória sutil para organizar o design */}
  <div className="w-11/12 h-[1px] bg-white/20" />
  
  {/* Frase abaixo do calendário ocupando 100% do espaço com segurança */}
  <span className="text-[10px] font-medium text-emerald-100 tracking-widest text-center uppercase block w-full whitespace-normal leading-normal">
    Tecnologia que organiza, escola que avança
  </span>
</div>
