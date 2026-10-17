import { ShieldCheck, Monitor, ShoppingCart, Search, Laptop, Lock, Unlock, Sparkles, Server, Terminal, Settings, Key } from 'lucide-react';

interface Props {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isAdminMode: boolean;
  setIsAdminMode: (admin: boolean) => void;
}

export function Header({ activeTab, setActiveTab, isAdminMode, setIsAdminMode }: Props) {
  const customerNavItems = [
    { id: 'store', label: '官方首页与下载', icon: Monitor },
    { id: 'pricing-section', label: '正版授权选购', icon: ShoppingCart },
    { id: 'license-client', label: '客户端激活检测', icon: Laptop },
    { id: 'affiliate-portal', label: '一级代理分账中枢 (40%)', icon: Sparkles },
  ];

  const adminNavItems = [
    { id: 'cloud-control', label: '云端授权中控台', icon: Server },
    { id: 'codex-kit', label: 'Codex联调包与公钥验签', icon: Key },
    { id: 'affiliate-portal', label: '渠道合伙人(40%分成)', icon: Sparkles },
    { id: 'diagnosis', label: '架构与缺口诊断', icon: Settings },
    { id: 'deploy-kit', label: '一键部署工具', icon: Terminal },
    { id: 'hk-server', label: '香港服务器', icon: Server }
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-base text-slate-900 dark:text-white leading-tight block">
                官方正版软件中心
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                企业级安全授权 · 官方高速下载 · 极速交付
              </span>
            </div>
          </div>

          {/* Navigation Bar */}
          <nav className="hidden md:flex items-center gap-1">
            {customerNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}

            {isAdminMode && adminNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Partner / Admin Mode Toggle (Discreetly on the right) */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAdminMode(!isAdminMode)}
              className={`text-xs px-3 py-1.5 rounded-lg border font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                isAdminMode
                  ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 border-slate-200 dark:border-slate-700'
              }`}
              title="切换客户视图与后台管理"
            >
              {isAdminMode ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              <span>{isAdminMode ? '后台管理模式' : '渠道/管理后台'}</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex overflow-x-auto py-2 gap-1 border-t border-slate-100 dark:border-slate-800 scrollbar-none">
          {customerNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold shrink-0 flex items-center gap-1 cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
