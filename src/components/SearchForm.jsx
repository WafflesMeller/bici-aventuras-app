import React from "react";
import { Search, Loader2 } from "lucide-react";

function SearchForm({
  loading,
  search,       
  setSearch,    
  handleSearch, 
}) {
  
  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="w-full relative group">
      
      {/* 1. INPUT PRINCIPAL */}
      {/* Note: pr-14 deja espacio a la derecha para el botón */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        disabled={loading}
        placeholder="Buscar cliente, cédula o referencia..."
        className="w-full bg-black/20 border border-white/10 rounded-full pl-4 pr-14 h-14 text-base text-white placeholder:text-white/30 focus:border-primary/50 focus:bg-black/40 focus:ring-1 focus:ring-primary/20 transition-all outline-none appearance-none"
      />

      {/* 2. BOTÓN/ICONO A LA DERECHA */}
      <button
        type="submit"
        disabled={loading}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-black rounded-full bg-primary transition-colors duration-300"
      >
        {loading ? (
          <Loader2 size={20} className="animate-spin text-primary" />
        ) : (
          <Search size={20} />
        )}
      </button>
      
    </form>
  );
}

export default SearchForm;