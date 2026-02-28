import { getPartners, getInteractions, getCustomReminders, getRecentInteractions, getCurrentUserDetails, getUsers } from '@/lib/actions';
export const dynamic = 'force-dynamic';
import { Users, AlertTriangle, CheckCircle, ArrowRight, Calendar, MessageSquare, Clock, Phone, Mail } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { getDict } from '@/lib/i18n';
import { NeedingAttentionList } from '@/components/NeedingAttentionList';

export default async function Dashboard() {
  const dict = await getDict();
  const allPartners = await getPartners();
  const userDetails = await getCurrentUserDetails();
  const userKP = userDetails?.name;
  const isAdmin = userDetails?.role === 'Admin';

  const allUsers = await getUsers();
  const teamKPs = new Set<string>();
  if (userDetails) {
    for (const wg of userDetails.workgroups) {
      for (const memberId of wg.member_ids) {
        const u = allUsers.find(x => x.id === memberId);
        if (u) {
          const kp = u.name;
          if (kp) teamKPs.add(kp);
        }
      }
    }
  }

  if (userKP) {
    teamKPs.add(userKP);
  }

  // Filter partners based on user context
  const partners = allPartners.filter(p => {
    if (isAdmin) return true; // Admins see all
    const isPersonal = userKP && p.key_person_id === userKP;
    const isWorkgroup = p.key_person_id && teamKPs.has(p.key_person_id);
    return isPersonal || isWorkgroup;
  });

  const totalPartners = partners.length;
  const activeCollaborations = partners.filter(p => p.health_status === 'Active').length;

  // Calculate partners needing attention
  const now = new Date();
  const needingAttention = [];

  for (const p of partners) {
    if (p.health_status === 'Dormant') continue;

    const lastInteractionStr = p.last_interaction_date;
    const dismissedAtStr = p.dismissed_at;

    let lastTouch = null;
    if (lastInteractionStr && dismissedAtStr) {
      const lid = new Date(lastInteractionStr);
      const dat = new Date(dismissedAtStr);
      lastTouch = lid > dat ? lid : dat;
    } else if (lastInteractionStr) {
      lastTouch = new Date(lastInteractionStr);
    } else if (dismissedAtStr) {
      lastTouch = new Date(dismissedAtStr);
    }

    let daysSinceLast = Infinity;
    if (lastTouch) {
      daysSinceLast = Math.floor((now.getTime() - lastTouch.getTime()) / (1000 * 3600 * 24));
    }

    if (daysSinceLast > p.needs_attention_days) {
      needingAttention.push({
        partner: p,
        daysSinceLast: daysSinceLast === Infinity ? 'Never' : daysSinceLast
      });
    }
  }

  const customReminders = await getCustomReminders();
  const nextAppointments = customReminders.slice(0, 5);
  const recentInteractions = await getRecentInteractions(5);

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out pb-8">
      <div className="relative">
        <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-3xl blur-2xl -z-10" />
        <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white drop-shadow-sm">{dict.dashboard.title}</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-3 text-lg font-medium">{dict.dashboard.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="glass-card rounded-[24px] p-6 group relative z-0">
          <div className="glow-indigo" />
          <div className="flex items-center justify-between relative z-10">
            <h3 className="text-slate-500 dark:text-slate-400 font-bold tracking-wider uppercase text-xs">{dict.dashboard.totalPartners}</h3>
            <div className="bg-indigo-50 dark:bg-indigo-900/30 p-3 rounded-2xl group-hover:bg-indigo-100 group-hover:scale-110 transition-all duration-300 shadow-sm">
              <Users className="text-indigo-600 w-6 h-6" />
            </div>
          </div>
          <p className="text-5xl font-extrabold mt-6 text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 transition-colors duration-300 relative z-10 drop-shadow-sm">{totalPartners}</p>
        </div>

        <div className="glass-card rounded-[24px] p-6 group relative z-0">
          <div className="glow-emerald" />
          <div className="flex items-center justify-between relative z-10">
            <h3 className="text-slate-500 dark:text-slate-400 font-bold tracking-wider uppercase text-xs">{dict.dashboard.activeCollaborations}</h3>
            <div className="bg-emerald-50 dark:bg-emerald-900/30 p-3 rounded-2xl group-hover:bg-emerald-100 group-hover:scale-110 transition-all duration-300 shadow-sm">
              <CheckCircle className="text-emerald-500 w-6 h-6" />
            </div>
          </div>
          <p className="text-5xl font-extrabold mt-6 text-slate-800 dark:text-slate-100 group-hover:text-emerald-500 transition-colors duration-300 relative z-10 drop-shadow-sm">{activeCollaborations}</p>
        </div>

        <div className="glass-card rounded-[24px] p-6 group relative z-0">
          <div className="glow-amber" />
          <div className="flex items-center justify-between relative z-10">
            <h3 className="text-slate-500 dark:text-slate-400 font-bold tracking-wider uppercase text-xs">{dict.dashboard.needsAttention}</h3>
            <div className="bg-amber-50 dark:bg-amber-900/30 p-3 rounded-2xl group-hover:bg-amber-100 group-hover:scale-110 transition-all duration-300 shadow-sm">
              <AlertTriangle className="text-amber-500 w-6 h-6" />
            </div>
          </div>
          <p className="text-5xl font-extrabold mt-6 text-slate-800 dark:text-slate-100 group-hover:text-amber-500 transition-colors duration-300 relative z-10 drop-shadow-sm">{needingAttention.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        <div className="glass-card rounded-[32px] overflow-hidden relative border border-white/60 dark:border-slate-700/60 flex flex-col">
          <div className="px-6 py-5 border-b border-white/40 dark:border-slate-700/40 flex items-center gap-3 bg-white/30 dark:bg-slate-800/30 backdrop-blur-md">
            <div className="p-2.5 bg-indigo-100/80 dark:bg-indigo-900/40 rounded-xl text-indigo-600 shadow-sm">
              <Calendar className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100">{dict.dashboard.nextAppointments}</h2>
          </div>
          <div className="divide-y divide-white/40 dark:divide-slate-700/40 bg-white/10 dark:bg-slate-800/10 flex-1">
            {nextAppointments.length === 0 ? (
              <div className="py-12 text-center text-slate-500 dark:text-slate-400 font-medium">{dict.dashboard.noUpcoming}</div>
            ) : (
              nextAppointments.map(app => {
                const partner = partners.find(p => p.id === app.partner_id);
                return (
                  <div key={app.id} className="px-6 py-4 flex items-center gap-4 hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800/50 flex items-center justify-center shrink-0 overflow-hidden">
                      {partner && partner.logo_url ? (
                        <img src={partner.logo_url} alt={partner.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-indigo-600 font-bold text-sm">{partner ? partner.name.charAt(0).toUpperCase() : '?'}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-800 dark:text-slate-100 font-bold truncate">{app.title}</p>
                      <div className="flex items-center gap-1.5 mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{new Date(app.due_date).toLocaleDateString()}</span>
                        {partner && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span className="truncate">{partner.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <Link href={`/reminders`} className="text-slate-400 dark:text-slate-500 hover:text-indigo-600 transition-colors">
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="glass-card rounded-[32px] overflow-hidden relative border border-white/60 dark:border-slate-700/60 flex flex-col">
          <div className="px-6 py-5 border-b border-white/40 dark:border-slate-700/40 flex items-center gap-3 bg-white/30 dark:bg-slate-800/30 backdrop-blur-md">
            <div className="p-2.5 bg-emerald-100/80 dark:bg-emerald-900/40 rounded-xl text-emerald-600 shadow-sm">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100">{dict.dashboard.lastInteractions}</h2>
          </div>
          <div className="divide-y divide-white/40 dark:divide-slate-700/40 bg-white/10 dark:bg-slate-800/10 flex-1">
            {recentInteractions.length === 0 ? (
              <div className="py-12 text-center text-slate-500 dark:text-slate-400 font-medium">{dict.dashboard.noRecent}</div>
            ) : (
              recentInteractions.map(interaction => (
                <div key={interaction.id} className="px-6 py-4 flex items-start gap-4 hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors group">
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-white dark:border-slate-800 shadow-sm flex items-center justify-center overflow-hidden">
                      {interaction.partner_logo ? (
                        <img src={interaction.partner_logo} alt={interaction.partner_name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-lg font-bold text-indigo-500">{interaction.partner_name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-center text-slate-500 dark:text-slate-400 scale-90">
                      {interaction.type === 'call' ? <Phone className="w-3 h-3" /> :
                        interaction.type === 'meeting' ? <Calendar className="w-3 h-3" /> :
                          <Mail className="w-3 h-3" />}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <Link href={`/partners/${interaction.partner_id}`} className="text-slate-800 dark:text-slate-100 font-bold truncate group-hover:text-emerald-600 transition-colors">
                        {interaction.partner_name}
                      </Link>
                      <span className="text-xs font-medium text-slate-400 dark:text-slate-500 whitespace-nowrap ml-2">
                        {new Date(interaction.date).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{interaction.notes}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      <div className="glass-card rounded-[32px] overflow-hidden relative border border-white/60 dark:border-slate-700/60">
        <div className="px-8 py-6 border-b border-white/40 dark:border-slate-700/40 flex items-center justify-between bg-white/30 dark:bg-slate-800/30 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-100/80 dark:bg-amber-900/40 rounded-xl text-amber-600 shadow-sm">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100">{dict.dashboard.partnersNeeding}</h2>
          </div>
          <span className="text-sm font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 px-4 py-1.5 rounded-full shadow-sm border border-amber-200/50 dark:border-amber-700/50">
            {needingAttention.length} {dict.dashboard.pending}
          </span>
        </div>

        {needingAttention.length === 0 ? (
          <div className="px-8 py-20 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center justify-center bg-white/10 dark:bg-slate-800/10">
            <div className="bg-emerald-50 dark:bg-emerald-900/30 w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-inner ring-8 ring-white/50 dark:ring-slate-700/50">
              <CheckCircle className="w-12 h-12 text-emerald-500" />
            </div>
            <p className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">{dict.dashboard.allCaughtUp}</p>
            <p className="text-base font-medium mt-2 text-slate-500 dark:text-slate-400">{dict.dashboard.noPartnersRequire}</p>
          </div>
        ) : (
          <NeedingAttentionList items={needingAttention as any} dict={dict} />
        )}
      </div>
    </div>
  );
}
