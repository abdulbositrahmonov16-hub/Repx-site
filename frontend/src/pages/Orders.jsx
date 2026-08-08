import React, { useState, useEffect } from 'react';
import { formatPrice } from '../utils/cart';
import { BACKEND_URL } from '../utils/api';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Загружаем все заказы с вашего сервера на Render
  const loadOrders = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/orders`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (e) {
      console.error("Ошибка загрузки заказов", e);
    } finally {
      setLoading(false);
    }
  };

  // Функция перевода заказа в статус "Оплачен" (Чинит выручку!)
  const markAsPaid = async (orderId) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/orders/${orderId}/complete`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        // Обновляем список на экране
        loadOrders();
      }
    } catch (e) {
      alert("Не удалось изменить статус");
    }
  };

  useEffect(() => { loadOrders(); }, []);

  if (loading) return <div className="p-8 text-center text-zinc-400 font-bold">ЗАГРУЗКА ЖУРНАЛА ЗАКАЗОВ...</div>;

  return (
    <div className="min-h-screen bg-zinc-50 p-4 pb-24 text-black">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-black uppercase tracking-tight mb-6">Журнал заказов</h1>
        
        {orders.length === 0 ? (
          <p className="text-zinc-400 font-bold text-center py-12 uppercase">Новых заказов пока нет</p>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id || order._id} className="bg-white p-4 rounded-xl shadow-sm border border-zinc-100 flex flex-col justify-between gap-4">
                <div>
                  <div className="flex justify-between items-center border-b border-zinc-100 pb-2 mb-2">
                    <span className="text-xs font-black text-zinc-400 uppercase">Заказ #{ (order.id || order._id).slice(-4) }</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      order.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {order.status === 'completed' ? 'Оплачен' : 'Новый'}
                    </span>
                  </div>
                  
                  {/* Список товаров в заказе */}
                  <div className="space-y-1.5">
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="text-sm font-medium text-zinc-800">
                        • {item.name} ({item.color || 'Оригинал'}) — размер {item.size}, {item.quantity} шт.
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-zinc-100 mt-2">
                  <div>
                    <span className="text-xs font-bold text-zinc-400 block uppercase">Итого</span>
                    <span className="text-base font-black text-black">{formatPrice ? formatPrice(order.total_price) : `${order.total_price?.toLocaleString()} сум`}</span>
                  </div>
                  
                  {order.status !== 'completed' && (
                    <button 
                      onClick={() => markAsPaid(order.id || order._id)}
                      className="px-4 py-2 bg-black text-white text-xs font-black rounded-lg uppercase tracking-wider hover:bg-zinc-800 transition-colors"
                    >
                      Оплачено
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
