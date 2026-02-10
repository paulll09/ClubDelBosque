import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-6">
                    <div className="max-w-md text-center bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl">
                        <h2 className="text-2xl font-bold text-red-400 mb-4">¡Ups! Algo salió mal.</h2>
                        <p className="text-slate-400 mb-6">
                            Ocurrió un error inesperado en la aplicación. Por favor, recargá la página.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 px-6 rounded-xl transition-all"
                        >
                            Recargar Página
                        </button>
                        {process.env.NODE_ENV === 'development' && (
                            <pre className="mt-8 text-left text-xs text-red-300 bg-red-900/20 p-4 rounded overflow-auto max-h-40">
                                {this.state.error?.toString()}
                            </pre>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
