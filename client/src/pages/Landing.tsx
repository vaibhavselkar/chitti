import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  DollarSign,
  BarChart3,
  Bell,
  Calendar,
  Menu,
  X,
  Star,
  ArrowRight,
  Zap,
  CheckCircle2,
  PenLine,
  Clock,
} from 'lucide-react';

const Landing: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const features = [
    {
      icon: Calendar,
      title: 'Chit Group Management',
      description: 'Create groups with a fixed monthly collection date. All reminders and schedules are built around that date automatically.',
      color: 'text-sky-600',
      bg: 'bg-sky-100',
    },
    {
      icon: Users,
      title: 'Simple Member Onboarding',
      description: 'Add members with just their name and phone number. Admin enrolls them directly into any chit group — no paperwork.',
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },
    {
      icon: Bell,
      title: 'Automated WhatsApp Reminders',
      description: '5 days before collection date, on the day, and again if unpaid — WhatsApp reminders sent automatically to every member.',
      color: 'text-cyan-600',
      bg: 'bg-cyan-100',
    },
    {
      icon: PenLine,
      title: 'Admin Signature on Receipts',
      description: "Admin's digital signature appears on every paid month's column — making collections legally traceable and professional.",
      color: 'text-indigo-600',
      bg: 'bg-indigo-100',
    },
    {
      icon: DollarSign,
      title: 'Payment Tracking Grid',
      description: 'Visual month-by-month payment grid for each member. Paid months show admin signature. Unpaid months shown clearly.',
      color: 'text-sky-700',
      bg: 'bg-sky-100',
    },
    {
      icon: BarChart3,
      title: 'Reports & Analytics',
      description: 'Monthly collection reports, pending payment lists, and chit-wise summaries at your fingertips.',
      color: 'text-blue-700',
      bg: 'bg-blue-100',
    },
  ];

  const steps = [
    { step: '01', title: 'Create a Chit Group', desc: 'Set contribution amount, duration, number of members, and the monthly collection day.' },
    { step: '02', title: 'Add Members', desc: 'Enroll members with just their name and phone number. That\'s it — no forms, no documents.' },
    { step: '03', title: 'Collect Payments', desc: 'Record monthly payments. Admin signature auto-stamps the paid column as confirmation.' },
    { step: '04', title: 'Reminders Run Automatically', desc: 'WhatsApp reminders go out 5 days before, on the day, and after if payment is still pending.' },
  ];

  const testimonials = [
    { name: 'Rajesh Kumar', role: 'Chit Fund Manager, Hyderabad', text: 'Earlier I used to call every member manually. Now reminders go out on their own and everyone pays on time.' },
    { name: 'Sunita Devi', role: 'Finance Coordinator, Bengaluru', text: 'Adding a member takes 10 seconds — just name and number. The admin signature on each receipt is a great touch.' },
    { name: 'Mahesh Reddy', role: 'Community Organizer, Chennai', text: 'The payment grid with admin signature makes collections completely transparent. Members trust the system.' },
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">

      {/* Navbar */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md border-b border-sky-100 shadow-sm' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-sky-400 to-blue-600 rounded-lg flex items-center justify-center shadow-md shadow-sky-200">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight text-gray-900">Chitti</span>
            </div>

            <nav className="hidden md:flex items-center space-x-8 text-sm text-gray-600">
              <a href="#features" className="hover:text-sky-600 transition-colors">Features</a>
              <a href="#how-it-works" className="hover:text-sky-600 transition-colors">How it works</a>
              <a href="#testimonials" className="hover:text-sky-600 transition-colors">Testimonials</a>
            </nav>

            <div className="hidden md:flex items-center space-x-3">
              <Link to="/login" className="text-sm text-gray-600 hover:text-sky-600 transition-colors px-4 py-2">
                Sign in
              </Link>
              <Link to="/register" className="text-sm bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white px-5 py-2 rounded-lg transition-all font-medium shadow-md shadow-sky-200/50 hover:shadow-sky-300/50">
                Get Started
              </Link>
            </div>

            <button className="md:hidden p-2 text-gray-600" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden bg-white border-t border-sky-100 px-4 py-4 space-y-3 shadow-lg">
            <a href="#features" className="block text-gray-600 hover:text-sky-600 py-2 text-sm" onClick={() => setMenuOpen(false)}>Features</a>
            <a href="#how-it-works" className="block text-gray-600 hover:text-sky-600 py-2 text-sm" onClick={() => setMenuOpen(false)}>How it works</a>
            <a href="#testimonials" className="block text-gray-600 hover:text-sky-600 py-2 text-sm" onClick={() => setMenuOpen(false)}>Testimonials</a>
            <div className="pt-2 flex flex-col space-y-2">
              <Link to="/login" className="text-center text-sm border border-sky-200 text-sky-600 px-4 py-2 rounded-lg">Sign in</Link>
              <Link to="/register" className="text-center text-sm bg-gradient-to-r from-sky-500 to-blue-600 text-white px-4 py-2 rounded-lg font-medium">Get Started Free</Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center pt-16 overflow-hidden bg-gradient-to-br from-sky-50 via-white to-blue-50">
        {/* Decorative blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-sky-200/50 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -right-32 w-80 h-80 bg-blue-200/40 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/3 w-[600px] h-48 bg-sky-100/60 rounded-full blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#0ea5e908_1px,transparent_1px),linear-gradient(to_bottom,#0ea5e908_1px,transparent_1px)] bg-[size:48px_48px]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="inline-flex items-center space-x-2 bg-sky-100 border border-sky-200 rounded-full px-4 py-1.5 text-sm text-sky-700 mb-8 font-medium">
            <Star className="w-3.5 h-3.5 fill-sky-500 text-sky-500" />
            <span>India's smartest chit fund management platform</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight leading-tight mb-6 text-gray-900">
            Manage Chit Funds
            <br />
            <span className="bg-gradient-to-r from-sky-500 via-blue-500 to-cyan-500 bg-clip-text text-transparent">
              Without the Chaos
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Add members with just a name and phone. Set a collection date. Reminders go automatically via WhatsApp. Admin signature on every payment — fully digital.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-semibold px-8 py-3.5 rounded-xl transition-all duration-200 shadow-lg shadow-sky-300/40 hover:shadow-sky-400/50 hover:-translate-y-0.5"
            >
              <span>Start for Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto flex items-center justify-center border border-sky-200 hover:border-sky-400 bg-white hover:bg-sky-50 text-gray-700 font-semibold px-8 py-3.5 rounded-xl transition-all duration-200 hover:-translate-y-0.5 shadow-sm"
            >
              Sign In
            </Link>
          </div>

          <p className="mt-6 text-xs text-gray-400">No credit card required &nbsp;·&nbsp; Free to get started</p>

          {/* Hero dashboard mockup */}
          <div className="mt-20 relative max-w-4xl mx-auto">
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-sky-50 to-transparent z-10 pointer-events-none" />
            <div className="bg-white border border-sky-100 rounded-2xl p-4 sm:p-6 shadow-2xl shadow-sky-200/40">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <div className="ml-2 flex-1 bg-sky-50 rounded-md h-6 max-w-xs" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {[['Total Chits', '12', 'text-sky-600', 'bg-sky-50'], ['Members', '240', 'text-blue-600', 'bg-blue-50'], ['Collected', '₹24L', 'text-emerald-600', 'bg-emerald-50'], ['Pending', '18', 'text-orange-500', 'bg-orange-50']].map(([label, val, color, bg]) => (
                  <div key={label} className={`${bg} rounded-xl p-3 sm:p-4 border border-white`}>
                    <p className="text-xs text-gray-500 mb-1">{label}</p>
                    <p className={`text-lg sm:text-2xl font-bold ${color}`}>{val}</p>
                  </div>
                ))}
              </div>
              {/* Payment grid preview */}
              <div className="bg-sky-50 rounded-xl p-4 border border-sky-100">
                <div className="flex justify-between items-center mb-3">
                  <p className="text-sm font-semibold text-gray-700">Payment Grid — Mallesh Chit Fund</p>
                  <span className="text-xs bg-sky-200 text-sky-700 px-2 py-0.5 rounded-full font-medium">Collection: 10th</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr>
                        <th className="text-left py-2 px-2 text-gray-500 font-medium">Member</th>
                        {[1,2,3,4,5,6].map(m => (
                          <th key={m} className="px-2 py-2 text-gray-500 font-medium">M{m}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[['Ramesh K.', true, true, true, true, false, false], ['Suresh P.', true, true, true, false, false, false], ['Mahesh R.', true, true, false, false, false, false]].map(([name, ...paid]) => (
                        <tr key={name as string} className="border-t border-sky-100">
                          <td className="py-2 px-2 font-medium text-gray-700">{name}</td>
                          {(paid as boolean[]).map((p, i) => (
                            <td key={i} className="py-2 px-2 text-center">
                              {p ? (
                                <div className="inline-flex flex-col items-center">
                                  <CheckCircle2 className="w-4 h-4 text-sky-500" />
                                  <span className="text-sky-400 text-[9px] mt-0.5">✍ Admin</span>
                                </div>
                              ) : (
                                <div className="w-4 h-4 rounded-full border-2 border-gray-200 mx-auto" />
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-sky-100 bg-gradient-to-r from-sky-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {[['100%', 'Digital Records'], ['Auto', 'WhatsApp Reminders'], ['₹0', 'Paperwork Cost'], ['∞', 'Chit Groups']].map(([val, label]) => (
              <div key={label}>
                <p className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent">{val}</p>
                <p className="text-sm text-gray-500 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-sm text-sky-600 font-semibold tracking-widest uppercase mb-3">Everything you need</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900">
              Built for Chit Fund
              <span className="bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent"> Professionals</span>
            </h2>
            <p className="text-gray-500 mt-4 max-w-xl mx-auto">A complete toolkit to run your chit fund business transparently and on time.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="group relative bg-white border border-gray-100 rounded-2xl p-6 hover:border-sky-200 hover:shadow-lg hover:shadow-sky-100/50 transition-all duration-300 hover:-translate-y-1">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${f.bg} mb-4`}>
                    <Icon className={`w-6 h-6 ${f.color}`} />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-2">{f.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{f.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 bg-gradient-to-br from-sky-50 to-blue-50 border-y border-sky-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-sm text-sky-600 font-semibold tracking-widest uppercase mb-3">Simple process</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900">
              Up and running
              <span className="bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent"> in minutes</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            <div className="hidden lg:block absolute top-10 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-sky-300 to-transparent" />
            {steps.map((s) => (
              <div key={s.step} className="relative text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 text-white font-bold text-sm mb-4 shadow-lg shadow-sky-300/40 relative z-10">
                  {s.step}
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reminder highlight */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-sky-500 to-blue-600 rounded-3xl p-8 sm:p-12 text-white text-center shadow-2xl shadow-sky-300/30">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/20 mb-6">
              <Clock className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">Reminders That Actually Work</h2>
            <p className="text-sky-100 text-base leading-relaxed max-w-2xl mx-auto mb-8">
              Set your collection date once per chit group. The system automatically sends WhatsApp messages to every unpaid member — <strong className="text-white">5 days before</strong>, <strong className="text-white">on the day</strong>, and again <strong className="text-white">if still unpaid</strong>. Zero manual follow-up.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              {[['📅 5 Days Before', 'Advance reminder sent to all unpaid members'], ['🔔 On Collection Day', 'Due today reminder for all pending payments'], ['⚠️ After Due Date', 'Overdue alert until payment is recorded']].map(([title, desc]) => (
                <div key={title} className="bg-white/15 rounded-xl p-4 text-left">
                  <p className="font-semibold mb-1">{title}</p>
                  <p className="text-sky-100 text-xs">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 bg-gradient-to-br from-sky-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-sm text-sky-600 font-semibold tracking-widest uppercase mb-3">Testimonials</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">Trusted by fund managers</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-white border border-sky-100 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-sky-200 transition-all">
                <div className="flex space-x-1 mb-4">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-sky-400 text-sky-400" />)}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-6">"{t.text}"</p>
                <div>
                  <p className="text-gray-900 font-semibold text-sm">{t.name}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-white">
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="absolute inset-0 bg-gradient-to-r from-sky-100 to-blue-100 rounded-3xl -z-10 mx-4" />
          <div className="py-16 px-4">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 mb-4">
              Ready to modernize your
              <span className="bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent"> chit fund?</span>
            </h2>
            <p className="text-gray-500 text-lg mb-8">Join chit fund managers across India who've gone fully digital.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="flex items-center justify-center space-x-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-200 shadow-lg shadow-sky-300/40 hover:-translate-y-0.5 text-base"
              >
                <span>Create Your Account</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/login"
                className="flex items-center justify-center border border-sky-200 hover:border-sky-400 bg-white text-gray-700 font-semibold px-8 py-4 rounded-xl transition-all duration-200 text-base hover:-translate-y-0.5"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-sky-100 py-8 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gradient-to-br from-sky-400 to-blue-600 rounded-md flex items-center justify-center">
              <Zap className="w-3 h-3 text-white" />
            </div>
            <span className="font-semibold text-sm text-gray-900">Chitti Management</span>
          </div>
          <p className="text-gray-400 text-xs">© {new Date().getFullYear()} Chitti. All rights reserved.</p>
          <div className="flex space-x-4 text-xs text-gray-400">
            <Link to="/login" className="hover:text-sky-600 transition-colors">Login</Link>
            <Link to="/register" className="hover:text-sky-600 transition-colors">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
