import { useState } from 'react';
import { Laptop, KeyRound, ShieldCheck, ShieldAlert, CheckCircle2, XCircle, RefreshCw, Lock, Unlock, Cpu, HardDrive, Monitor } from 'lucide-react';

interface Props {
  latestIssuedKey?: string;
}

interface BindingData {
  plan: string;
  maxDevices: number;
  boundMachines: { machineKey: string; machineName: string; boundAt: string }[];
  expiresAt: string;
}

export function LicenseSimulator({ latestIssuedKey }: Props) {
  const [licenseKeyInput, setLicenseKeyInput] = useState(latestIssuedKey || 'YEAR-88FA-99BC-11CD-33EF');
  const [currentMachine, setCurrentMachine] = useState<'PC_1' | 'PC_2' | 'PC_3' | 'PC_4'>('PC_1');

  // Simulated Cloudflare D1 database state storing license-to-machines mapping
  const [bindings, setBindings] = useState<Record<string, BindingData>>({
    'YEAR-88FA-99BC-11CD-33EF': {
      plan: '年卡',
      maxDevices: 3,
      boundMachines: [
        { machineKey: 'PC_1', machineName: '设备 1 (办公室台式机)', boundAt: '2026-10-16 10:00' }
      ],
      expiresAt: '2027-10-16 23:59:59'
    }
  });

  const [activationResult, setActivationResult] = useState<{ success: boolean; message: string } | null>(null);

  const MACHINES = {
    PC_1: { name: '设备 1 (办公室电脑)', fingerprint: 'SHA256-INTEL-I7-UUID-8891' },
    PC_2: { name: '设备 2 (出差笔记本)', fingerprint: 'SHA256-APPLE-M3-UUID-4421' },
    PC_3: { name: '设备 3 (家中工作站)', fingerprint: 'SHA256-AMD-RYZEN-UUID-9912' },
    PC_4: { name: '设备 4 (超额设备测试)', fingerprint: 'SHA256-DELL-HOST-UUID-0019' }
  };

  const handleActivate = () => {
    const key = licenseKeyInput.trim();
    if (!key) {
      setActivationResult({ success: false, message: '请输入卡密！' });
      return;
    }

    const currentDeviceInfo = MACHINES[currentMachine];
    const existing = bindings[key];

    // Determine max devices based on key prefix or existing record
    const isQuarterly = key.startsWith('QUART');
    const planName = isQuarterly ? '三个月卡' : '年卡';
    const allowedLimit = isQuarterly ? 1 : 3;

    if (existing) {
      // Check if current machine is already bound
      const isAlreadyBound = existing.boundMachines.some(m => m.machineKey === currentMachine);

      if (isAlreadyBound) {
        setActivationResult({
          success: true,
          message: `【校验通过】当前设备 (${currentDeviceInfo.name}) 已在授权列表中！\n版本：${existing.plan} | 设备配额：${existing.boundMachines.length}/${existing.maxDevices} 台 | 支持 72 小时离线宽限期。`
        });
        return;
      }

      // Check if reached max limit
      if (existing.boundMachines.length >= existing.maxDevices) {
        setActivationResult({
          success: false,
          message: `【授权拦截】该${existing.plan}已达到最大绑定设备上限 (${existing.boundMachines.length}/${existing.maxDevices} 台)！\n已绑定设备：${existing.boundMachines.map(m => m.machineName).join('、')}。\n若需在当前设备使用，请先在旧设备上点击“解绑”。`
        });
        return;
      }

      // Still has slots: bind new machine
      const updatedMachines = [
        ...existing.boundMachines,
        { machineKey: currentMachine, machineName: currentDeviceInfo.name, boundAt: new Date().toLocaleString() }
      ];

      setBindings(prev => ({
        ...prev,
        [key]: {
          ...existing,
          boundMachines: updatedMachines
        }
      }));

      setActivationResult({
        success: true,
        message: `【设备绑定成功】已成功将 ${currentDeviceInfo.name} 接入授权！当前已用设备数：${updatedMachines.length}/${existing.maxDevices} 台。`
      });
    } else {
      // First time activation for a newly purchased key
      const newRecord: BindingData = {
        plan: planName,
        maxDevices: allowedLimit,
        boundMachines: [
          { machineKey: currentMachine, machineName: currentDeviceInfo.name, boundAt: new Date().toLocaleString() }
        ],
        expiresAt: isQuarterly ? '2027-01-16 23:59:59' : '2027-10-16 23:59:59'
      };

      setBindings(prev => ({
        ...prev,
        [key]: newRecord
      }));

      setActivationResult({
        success: true,
        message: `【首次激活成功】该${planName}已与 ${currentDeviceInfo.name} 首次绑定！\n最大允许设备数：${allowedLimit} 台 (当前已用 1/${allowedLimit} 台)。`
      });
    }
  };

  const handleUnbindCurrent = () => {
    const key = licenseKeyInput.trim();
    if (!key || !bindings[key]) {
      alert('未找到该卡密的绑定记录');
      return;
    }

    const existing = bindings[key];
    const filtered = existing.boundMachines.filter(m => m.machineKey !== currentMachine);

    if (filtered.length === existing.boundMachines.length) {
      alert(`当前选中的 ${MACHINES[currentMachine].name} 并未绑定此卡密，无需解绑。`);
      return;
    }

    setBindings(prev => ({
      ...prev,
      [key]: {
        ...existing,
        boundMachines: filtered
      }
    }));

    setActivationResult({
      success: true,
      message: `【解绑成功】已从授权中移除 ${MACHINES[currentMachine].name}！释放了 1 个设备配额 (当前剩余已用 ${filtered.length}/${existing.maxDevices} 台)。`
    });
  };

  const currentBinding = bindings[licenseKeyInput.trim()];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm mb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Laptop className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              设备多开控制 · 客户端授权校验模拟器
            </h2>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            三个月卡限制 1 台电脑 · 年卡支持 3 台电脑同时在线 · 超额实时阻断
          </p>
        </div>

        {/* Machine Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs flex-wrap">
          <span className="text-slate-400 px-2 font-medium">当前操作电脑：</span>
          {(['PC_1', 'PC_2', 'PC_3', 'PC_4'] as const).map((pcKey) => {
            const isCurrent = currentMachine === pcKey;
            return (
              <button
                key={pcKey}
                onClick={() => {
                  setCurrentMachine(pcKey);
                  setActivationResult(null);
                }}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  isCurrent
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Monitor className="w-3 h-3" />
                <span>{pcKey === 'PC_4' ? '设备4 (测试超额)' : `设备${pcKey.slice(-1)}`}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Client UI Simulation */}
        <div className="lg:col-span-7 bg-slate-950 text-slate-200 rounded-2xl p-6 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
              </div>
              <span className="text-xs font-mono text-slate-400 ml-2">软件启动授权检测 (客户端界面)</span>
            </div>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-bold">
              {MACHINES[currentMachine].name}
            </span>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <label className="text-xs text-slate-400 block mb-1">
                软件卡密 (输入年卡可绑3台，三个月卡限绑1台):
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="例如 YEAR-88FA-99BC-11CD-33EF"
                  value={licenseKeyInput}
                  onChange={(e) => setLicenseKeyInput(e.target.value.toUpperCase())}
                  className="flex-1 font-mono text-xs px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500 uppercase"
                />
                {latestIssuedKey && (
                  <button
                    onClick={() => setLicenseKeyInput(latestIssuedKey)}
                    className="text-[11px] bg-slate-800 hover:bg-slate-700 text-indigo-300 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer border border-slate-700 shrink-0"
                  >
                    填入商城刚买的卡密
                  </button>
                )}
              </div>
            </div>

            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800/80 text-xs space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                  当前电脑硬件特征指纹 (Machine Fingerprint):
                </span>
                <span className="text-emerald-400 font-mono text-[11px]">已采集</span>
              </div>
              <div className="font-mono text-[11px] text-slate-300 bg-slate-950 p-2 rounded border border-slate-800 truncate">
                {MACHINES[currentMachine].fingerprint}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleActivate}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-indigo-600/30"
              >
                <KeyRound className="w-4 h-4" />
                <span>连接 Cloudflare 验证并激活当前电脑</span>
              </button>

              <button
                onClick={handleUnbindCurrent}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs px-4 py-2.5 rounded-xl transition-colors cursor-pointer border border-slate-700"
              >
                解绑当前电脑
              </button>
            </div>
          </div>

          {/* Result Alert */}
          {activationResult && (
            <div
              className={`p-4 rounded-xl border text-xs flex items-start gap-2.5 whitespace-pre-line ${
                activationResult.success
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
              }`}
            >
              {activationResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="leading-relaxed font-mono">
                {activationResult.message}
              </div>
            </div>
          )}
        </div>

        {/* Right: Cloudflare D1 Backend State Inspector */}
        <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-200 dark:border-slate-700/60 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700 mb-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>Cloudflare D1 设备配额锁定状态</span>
              </div>
              <span className="text-[10px] text-emerald-600 font-bold bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded">
                原子锁定
              </span>
            </div>

            {currentBinding ? (
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-indigo-200 dark:border-indigo-800/60 text-xs space-y-3 mb-4">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900 dark:text-white">{currentBinding.plan}</span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                    配额：{currentBinding.boundMachines.length} / {currentBinding.maxDevices} 台
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      currentBinding.boundMachines.length >= currentBinding.maxDevices
                        ? 'bg-amber-500'
                        : 'bg-indigo-600'
                    }`}
                    style={{
                      width: `${(currentBinding.boundMachines.length / currentBinding.maxDevices) * 100}%`
                    }}
                  ></div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <div className="text-[11px] font-semibold text-slate-500">已绑定的设备清单：</div>
                  {currentBinding.boundMachines.length === 0 ? (
                    <div className="text-slate-400 text-xs italic">尚未绑定任何设备</div>
                  ) : (
                    currentBinding.boundMachines.map((m, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-800 text-[11px]">
                        <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          {m.machineName}
                        </span>
                        <span className="text-[10px] text-slate-400">{m.boundAt}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-center text-slate-400 text-xs mb-4">
                当前卡密未激活。请在左侧点击激活！
              </div>
            )}
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-950/30 p-3 rounded-xl border border-indigo-200 dark:border-indigo-800/40 text-[11px] text-indigo-900 dark:text-indigo-300 space-y-1">
            <strong className="block">业务规则测试指引：</strong>
            <div>1. 输入<strong>年卡</strong>卡密，可在设备 1、设备 2、设备 3 顺利激活 (3台全通)；</div>
            <div>2. 切换到<strong>设备 4</strong> 再次点击激活，系统将精准拦截并提示“已满 3 台上限”！</div>
          </div>
        </div>
      </div>
    </div>
  );
}
