import { Users, Handshake, Briefcase, Network, MessageCircle, Lightbulb, TrendingUp, Repeat } from 'lucide-react';
import { clubBenefits, noGuarantee } from '../data/clubContent';

const icons = [Users, Handshake, Briefcase, Network, MessageCircle, Lightbulb, TrendingUp, Repeat];
const accents = ['bg-red-50 text-red-600', 'bg-orange-50 text-orange-600', 'bg-emerald-50 text-emerald-600'];

export function ClubBenefitsSection() {
  return <section className="py-20 lg:py-28 bg-slate-50 border-b border-slate-200/70" aria-labelledby="club-benefits-title">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h2 id="club-benefits-title" className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">Event4Network size ne sağlar?</h2>
        <p className="text-slate-600 text-base sm:text-lg leading-relaxed">{noGuarantee}</p>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {clubBenefits.map((benefit, index) => {
          const Icon = icons[index];
          return <article key={benefit.title} className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${accents[index % accents.length]}`}><Icon aria-hidden="true" className="w-6 h-6" /></div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">{benefit.title}</h3>
            <p className="text-slate-600 text-sm leading-relaxed">{benefit.text}</p>
          </article>;
        })}
      </div>
    </div>
  </section>;
}
