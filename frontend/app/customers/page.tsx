'use client';

import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import { customersApi, debtApi, Customer, DebtRecord } from '../../lib/api';
import { User, Phone, MapPin, DollarSign, History, Plus, Search, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { formatCurrency, formatDateTime } from '../../lib/utils';
import { cn } from '../../lib/utils';

import { isOwnerSessionValid } from '../../lib/auth';
import { useRouter } from 'next/navigation';

export default function CustomersPage() {
    const router = useRouter();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState<'add' | 'payment'>('add');
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [amount, setAmount] = useState(0);
    const [notes, setNotes] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        address: '',
        credit_limit: 50000
    });

    useEffect(() => {
        if (!isOwnerSessionValid()) {
            router.replace('/login');
        }
    }, [router]);

    useEffect(() => {
        loadCustomers();
    }, []);

    const loadCustomers = async () => {
        try {
            const data = await customersApi.getAll();
            setCustomers(data);
        } catch (error) {
            console.error('Failed to load customers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (modalType === 'add') {
                await customersApi.create(formData);
            } else if (modalType === 'payment' && selectedCustomer) {
                await debtApi.logPayment(selectedCustomer.id, amount, notes);
            }
            setShowModal(false);
            resetForms();
            loadCustomers();
        } catch (error) {
            console.error('Operation failed:', error);
        }
    };

    const resetForms = () => {
        setFormData({ name: '', phone: '', address: '', credit_limit: 50000 });
        setAmount(0);
        setNotes('');
        setSelectedCustomer(null);
    };

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm)
    );

    const totalReceivables = customers.reduce((sum, c) => sum + c.total_debt, 0);

    return (
        <div className="min-h-screen page-enter" style={{ backgroundColor: 'var(--bg)' }}>
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="flex justify-between items-center mb-10">
                    <div className="flex items-center gap-3">
                        <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-3)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                            <User size={24} color="var(--accent)" />
                        </div>
                        <h1 style={{ fontSize: '2.5rem', lineHeight: 1 }}>CRMs & Debt</h1>
                    </div>

                    <button onClick={() => { setModalType('add'); setShowModal(true); }} className="btn btn-primary">
                        <Plus size={18} />
                        ADD_CUSTOMER
                    </button>
                </div>

                {/* Overview Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="card">
                        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-3)' }}>TOTAL_RECEIVABLES</p>
                        <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--danger)' }}>{formatCurrency(totalReceivables)}</p>
                    </div>
                    <div className="card">
                        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-3)' }}>ACTIVE_DEBTORS</p>
                        <p style={{ fontSize: '2rem', fontWeight: 800 }}>{customers.filter(c => c.total_debt > 0).length}</p>
                    </div>
                    <div className="card">
                        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-3)' }}>CUSTOMER_BASE</p>
                        <p style={{ fontSize: '2rem', fontWeight: 800 }}>{customers.length}</p>
                    </div>
                </div>

                {/* Customer List */}
                <div className="card">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-3)]" size={16} />
                            <input
                                type="text"
                                placeholder="Search by name or phone..."
                                className="input w-full pl-10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>CUSTOMER_IDENTITY</th>
                                    <th>CONTACT_INFO</th>
                                    <th className="text-right">CREDIT_LIMIT</th>
                                    <th className="text-right">OUTSTANDING</th>
                                    <th className="text-right">RISK</th>
                                    <th className="text-right">MGMT</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCustomers.map(customer => {
                                    const usage = customer.total_debt / customer.credit_limit;
                                    const isHighRisk = usage > 0.8;
                                    return (
                                        <tr key={customer.id}>
                                            <td>
                                                <div className="flex flex-col">
                                                    <span style={{ fontWeight: 700 }}>{customer.name}</span>
                                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>ID: {customer.id.toString().slice(-6)}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2 opacity-70">
                                                        <Phone size={12} />
                                                        <span style={{ fontSize: '0.8rem' }}>{customer.phone}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 opacity-70">
                                                        <MapPin size={12} />
                                                        <span style={{ fontSize: '0.8rem' }}>{customer.address}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="text-right mono">{formatCurrency(customer.credit_limit)}</td>
                                            <td className="text-right mono font-bold" style={{ color: customer.total_debt > 0 ? 'var(--danger)' : 'inherit' }}>
                                                {formatCurrency(customer.total_debt)}
                                            </td>
                                            <td className="text-right">
                                                <span className={cn("badge", isHighRisk ? "badge-danger" : customer.total_debt > 0 ? "badge-info" : "badge-accent")}>
                                                    {isHighRisk ? 'HIGH_RISK' : customer.total_debt > 0 ? 'DEBTOR' : 'CLEAR'}
                                                </span>
                                            </td>
                                            <td className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => { setSelectedCustomer(customer); setModalType('payment'); setShowModal(true); }}
                                                        className="btn btn-outline p-1.5"
                                                        title="Log Payment"
                                                    >
                                                        <DollarSign size={14} color="var(--accent)" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
                    <div className="card p-8 w-full max-w-lg relative">
                        <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 p-2 hover:bg-[var(--bg-3)] rounded-full">
                            <X size={20} />
                        </button>

                        <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>
                            {modalType === 'add' ? 'Register New Customer' : `Log Payment: ${selectedCustomer?.name}`}
                        </h3>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {modalType === 'add' ? (
                                <>
                                    <div className="space-y-2">
                                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-3)' }}>FULL_NAME</label>
                                        <input
                                            type="text"
                                            className="input w-full"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-3)' }}>PHONE_NUMBER</label>
                                            <input
                                                type="text"
                                                className="input w-full"
                                                required
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-3)' }}>CREDIT_LIMIT</label>
                                            <input
                                                type="number"
                                                className="input w-full"
                                                required
                                                value={formData.credit_limit}
                                                onChange={(e) => setFormData({ ...formData, credit_limit: parseInt(e.target.value) || 0 })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-3)' }}>ADDRESS</label>
                                        <textarea
                                            className="input w-full min-h-[80px] py-3"
                                            required
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="p-4 rounded-[var(--radius)] bg-[var(--bg-3)] border border-[var(--border)]">
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-2)', marginBottom: '0.5rem' }}>CURRENT_DEBT</p>
                                        <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--danger)' }}>{formatCurrency(selectedCustomer?.total_debt || 0)}</p>
                                    </div>
                                    <div className="space-y-2">
                                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-3)' }}>PAYMENT_AMOUNT</label>
                                        <input
                                            type="number"
                                            className="input w-full text-center text-2xl h-16"
                                            required autoFocus
                                            value={amount}
                                            onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-3)' }}>NOTES</label>
                                        <input
                                            type="text"
                                            className="input w-full"
                                            placeholder="e.g. Paid via Transfer"
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                        />
                                    </div>
                                </>
                            )}

                            <button type="submit" className="btn btn-primary w-full py-4 uppercase">
                                {modalType === 'add' ? 'Register Customer' : 'Confirm Payment'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
