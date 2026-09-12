'use client';

export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground text-center p-4">
      <h1 className="text-4xl font-bold mb-4 text-primary">Você está offline</h1>
      <p className="text-lg text-muted-foreground mb-8">
        Verifique a sua ligação à internet para continuar a usar o Wamini.
      </p>
      <button 
        onClick={() => window.location.reload()} 
        className="px-6 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg shadow-md transition-colors font-medium"
      >
        Tentar Novamente
      </button>
    </div>
  );
}
