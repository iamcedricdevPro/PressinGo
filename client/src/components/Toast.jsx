import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
	const [toasts, setToasts] = useState([]);
	const add = useCallback((type, message) => {
		const id = Math.random().toString(36).slice(2);
		setToasts((t) => [...t, { id, type, message }]);
		setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
	}, []);
	const value = useMemo(() => ({ success: (m) => add('success', m), error: (m) => add('error', m), info: (m) => add('info', m) }), [add]);
	return (
		<ToastContext.Provider value={value}>
			{children}
			<div className="fixed top-4 right-4 z-50 space-y-2">
				{toasts.map((t) => (
					<div key={t.id} className={`px-4 py-2 rounded shadow text-white animate-fadeIn ${t.type === 'success' ? 'bg-green-600' : t.type === 'error' ? 'bg-red-600' : 'bg-blue-600'}`}>{t.message}</div>
				))}
			</div>
		</ToastContext.Provider>
	);
}

export function useToast() {
	return useContext(ToastContext);
}


