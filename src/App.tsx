/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Header } from './components/Header';
import { StoreFront } from './components/StoreFront';
import { AffiliatePortal } from './components/AffiliatePortal';
import { LicenseSimulator } from './components/LicenseSimulator';
import { DiagnosisBanner } from './components/DiagnosisBanner';
import { OneClickDeployKit } from './components/OneClickDeployKit';
import { HongKongServerGuide } from './components/HongKongServerGuide';
import { ChinaAccessGuide } from './components/ChinaAccessGuide';
import { SolutionFinder } from './components/SolutionFinder';
import { ComparisonMatrix } from './components/ComparisonMatrix';
import { PaymentStrategyGuide } from './components/PaymentStrategyGuide';
import { CommissionSimulator } from './components/CommissionSimulator';
import { ArchitectureFlow } from './components/ArchitectureFlow';
import { CodeBlueprintViewer } from './components/CodeBlueprintViewer';
import { CodexDeliveryKit } from './components/CodexDeliveryKit';
import { CloudControlCenter } from './components/CloudControlCenter';
import { Sparkles, ShieldCheck, Lock, Unlock } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('store');
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);
  const [showAgentSection, setShowAgentSection] = useState<boolean>(false);
  const [selectedSolutionId, setSelectedSolutionId] = useState<string>('cloudflare-serverless');
  
  // Real-time state shared across Store, Affiliate & Client License Activation
  const [referrerCode, setReferrerCode] = useState<string>('VIP888');
  const [orders, setOrders] = useState<any[]>([
    {
      orderId: 'ORD-78192031',
      productName: '年卡 (支持3台设备)',
      amount: 99.00,
      licenseKey: 'YEAR-88FA-99BC-11CD-33EF',
      buyerEmail: 'client@company.com',
      referrerCode: 'VIP888',
      commissionAmount: 39.60,
      time: '10分钟前'
    }
  ]);
  const [latestIssuedKey, setLatestIssuedKey] = useState<string>('YEAR-88FA-99BC-11CD-33EF');

  const scrollToSection = (id: string) => {
    setActiveTab(id);
    if (['cloud-control', 'codex-kit', 'diagnosis', 'deploy-kit', 'hk-server', 'china-access', 'matrix', 'payment'].includes(id)) {
      setIsAdminMode(true);
    }
    setTimeout(() => {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 50);
  };

  const handleOpenAgentPortal = () => {
    setShowAgentSection(true);
    setActiveTab('affiliate-portal');
    setTimeout(() => {
      const el = document.getElementById('affiliate-portal');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 50);
  };

  const handleOrderPaid = (order: any) => {
    setOrders(prev => [order, ...prev]);
    setLatestIssuedKey(order.licenseKey);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans">
      <Header
        activeTab={activeTab}
        setActiveTab={scrollToSection}
        isAdminMode={isAdminMode}
        setIsAdminMode={setIsAdminMode}
        onOpenAgentPortal={handleOpenAgentPortal}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Customer Facing Store & Software Downloads */}
        <section id="store">
          <StoreFront
            referrerCode={referrerCode}
            onOrderPaid={handleOrderPaid}
            orders={orders}
          />
        </section>

        {/* Customer Facing License Activation Check */}
        <section id="license-client" className="pt-8">
          <LicenseSimulator
            latestIssuedKey={latestIssuedKey}
          />
        </section>

        {/* AGENT / DISTRIBUTOR WORKSTATION SECTION */}
        {(showAgentSection || isAdminMode) && (
          <section id="affiliate-portal" className="mt-12 pt-8 border-t-2 border-emerald-500/20 animate-in fade-in duration-300">
            <AffiliatePortal
              orders={orders}
              currentAffiliateCode={referrerCode}
              onSetAffiliateCode={setReferrerCode}
            />
          </section>
        )}

        {/* ADMIN PRIVATE PORTAL (Only shown when Admin Mode is toggled) */}
        {isAdminMode && (
          <div className="mt-12 pt-8 border-t-2 border-dashed border-purple-300 dark:border-purple-800 space-y-12 animate-in fade-in duration-300">
            <div className="bg-purple-900/10 border border-purple-500/30 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-purple-700 dark:text-purple-300 font-bold">
                <Lock className="w-4 h-4 text-purple-500" />
                <span>当前已开启【内部管理与运维中控后台】</span>
              </div>
              <button
                onClick={() => setIsAdminMode(false)}
                className="text-xs bg-purple-600 hover:bg-purple-500 text-white font-semibold px-3 py-1 rounded-lg transition-colors cursor-pointer"
              >
                关闭管理视图
              </button>
            </div>

            {/* Live Cloud License Authority & Roadmap Audit Console */}
            <section id="cloud-control">
              <CloudControlCenter />
            </section>

            {/* Codex Delivery Kit & Live Cryptographic Verifier */}
            <section id="codex-kit">
              <CodexDeliveryKit />
            </section>

            {/* Problem Diagnosis */}
            <section id="diagnosis">
              <DiagnosisBanner onSelectSolution={(id) => {
                setSelectedSolutionId(id);
                scrollToSection('matrix');
              }} />
            </section>

            {/* One Click Deploy Kit */}
            <section id="deploy-kit">
              <OneClickDeployKit />
            </section>

            {/* Hong Kong Server Guide */}
            <section id="hk-server">
              <HongKongServerGuide />
            </section>

            {/* Mainland China Access Guide */}
            <section id="china-access">
              <ChinaAccessGuide />
            </section>

            {/* Solution Finder */}
            <section id="finder">
              <SolutionFinder onSelectSolution={(id) => {
                setSelectedSolutionId(id);
                scrollToSection('matrix');
              }} />
            </section>

            {/* Matrix */}
            <section id="matrix">
              <ComparisonMatrix
                selectedId={selectedSolutionId}
                onSelect={(id) => setSelectedSolutionId(id)}
              />
            </section>

            {/* Payment Strategy */}
            <section id="payment">
              <PaymentStrategyGuide />
            </section>

            {/* Commission Simulator */}
            <section id="affiliate">
              <CommissionSimulator />
            </section>

            {/* Architecture Flow */}
            <section id="flow">
              <ArchitectureFlow />
            </section>

            {/* Code Blueprints */}
            <section id="code">
              <CodeBlueprintViewer />
            </section>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800 py-8 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-medium">
            <ShieldCheck className="w-4 h-4 text-indigo-500" />
            <span>官方正版软件中心 · 版权所有 © 2026</span>
          </div>
          <div className="flex items-center gap-4 text-slate-500">
            <span>官方技术支持：7×24小时在线</span>
            <span>·</span>
            <button
              onClick={handleOpenAgentPortal}
              className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
            >
              代理商登录入口
            </button>
            <span>·</span>
            <button
              onClick={() => setIsAdminMode(!isAdminMode)}
              className="text-slate-400 hover:text-indigo-500 underline cursor-pointer"
            >
              {isAdminMode ? '关闭管理员模式' : '管理员入口'}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
