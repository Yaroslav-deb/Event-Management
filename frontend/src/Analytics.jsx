import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Analytics() {
    const data = [
        { date: '10 Лист', users: 2 },
        { date: '12 Лист', users: 5 },
        { date: '15 Лист', users: 8 },
        { date: '18 Лист', users: 3 },
        { date: '20 Лист', users: 12 },
    ];

    return (
        <div style={{ width: '100%', maxWidth: '1000px', margin: '0 auto' }}>
            <h2 style={{ color: '#1e293b', marginBottom: '1.5rem' }}>Аналітика реєстрацій</h2>
            
            {/* Додано minWidth: '700px', щоб фізично заборонити графіку стискатися */}
            <div className="card" style={{ height: '450px', padding: '2rem', width: '100%', minWidth: '700px', boxSizing: 'border-box' }}>
                
                {/* Хак для Recharts: width="99%" вирішує проблему сплющення */}
                <ResponsiveContainer width="99%" height="100%">
                    <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                        <XAxis dataKey="date" stroke="#64748b" tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} dy={10} />
                        <YAxis stroke="#64748b" tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} dx={-10} />
                        <Tooltip 
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Line 
                            type="linear" 
                            dataKey="users" 
                            name="Кількість реєстрацій"
                            stroke="#4f46e5" 
                            strokeWidth={4} 
                            dot={{ r: 5, strokeWidth: 2, fill: '#fff' }} 
                            activeDot={{ r: 8, fill: '#4f46e5' }} 
                            isAnimationActive={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}