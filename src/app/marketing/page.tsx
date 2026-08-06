"use client";
import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import ThemeToggle from '@/components/ThemeToggle';
import { 
  Megaphone,
  Plug,
  TerminalSquare,
  Database as DatabaseIcon,
  Send,
  User,
  Loader2,
  PowerOff
} from 'lucide-react';
import '../agents/agents.css';
import marketingAgents from './marketingAgents.json';

const ReportDashboard = ({ isGoogle }: { isGoogle?: boolean }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
    <div>
      <h4 style={{ marginBottom: '8px', color: 'var(--text-loud)', fontSize: '16px' }}>Executive Real Estate Dashboard (Current Month)</h4>
      <p style={{ color: 'var(--text-muted)' }}>Consolidated performance across {isGoogle ? 'Google Network' : 'Meta Platforms'}. The pipeline remains robust with Cost Per Lead (CPL) down 14% month-over-month.</p>
    </div>
    
    <div>
      <div className="section-header" style={{ paddingLeft: 0 }}>1. Campaign Overview</div>
      <table className="report-table">
        <thead>
          <tr>
            <th>Campaign Name</th>
            <th>Spend</th>
            <th>Impressions</th>
            <th>Leads</th>
            <th>CPL</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Luxury Downtown Condos - Q3</td>
            <td>$12,450.00</td>
            <td>424,500</td>
            <td>245</td>
            <td>$50.81</td>
            <td style={{ color: 'var(--accent-primary)' }}>Scaling</td>
          </tr>
          <tr>
            <td>Suburban Family Homes (Retargeting)</td>
            <td>$4,800.00</td>
            <td>145,200</td>
            <td>112</td>
            <td>$42.85</td>
            <td style={{ color: 'var(--accent-primary)' }}>Stable</td>
          </tr>
          <tr>
            <td>First-Time Buyer Seminars (Local)</td>
            <td>$2,950.00</td>
            <td>88,100</td>
            <td>68</td>
            <td>$43.38</td>
            <td style={{ color: 'var(--accent-secondary)' }}>Reviewing</td>
          </tr>
          <tr>
            <td>Commercial Leasing Opportunities</td>
            <td>$8,200.00</td>
            <td>210,000</td>
            <td>45</td>
            <td>$182.22</td>
            <td style={{ color: 'var(--accent-primary)' }}>Scaling</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div>
      <div className="section-header" style={{ paddingLeft: 0 }}>2. Funnel Conversion Metrics</div>
      <table className="report-table">
        <thead>
          <tr>
            <th>Stage</th>
            <th>Volume</th>
            <th>Drop-off Rate</th>
            <th>Cost Per Action</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Link Clicks</td>
            <td>14,520</td>
            <td>-</td>
            <td>$1.95 (CPC)</td>
          </tr>
          <tr>
            <td>Landing Page Views</td>
            <td>11,200</td>
            <td>22.8%</td>
            <td>$2.53 (CPA)</td>
          </tr>
          <tr>
            <td>Lead Form Initiated</td>
            <td>1,450</td>
            <td>87.0%</td>
            <td>$19.58 (CPA)</td>
          </tr>
          <tr>
            <td>Qualified Leads (Submitted)</td>
            <td>470</td>
            <td>67.5%</td>
            <td>$60.42 (CPL)</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div>
      <div className="section-header" style={{ paddingLeft: 0 }}>3. Spend by Placement Channel</div>
      <table className="report-table">
        <thead>
          <tr>
            <th>Placement</th>
            <th>Budget Allocation</th>
            <th>ROAS Estimate</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{isGoogle ? 'Google Search (Intent)' : 'Facebook Newsfeed'}</td>
            <td>65%</td>
            <td>{isGoogle ? '4.8x' : '3.2x'}</td>
          </tr>
          <tr>
            <td>{isGoogle ? 'YouTube In-Stream' : 'Instagram Reels'}</td>
            <td>25%</td>
            <td>{isGoogle ? '2.8x' : '3.8x'}</td>
          </tr>
          <tr>
            <td>{isGoogle ? 'Google Display Network' : 'Audience Network'}</td>
            <td>10%</td>
            <td>1.2x (Awareness)</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
);

const ReportCreatives = ({ isGoogle }: { isGoogle?: boolean }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
    <div>
      <h4 style={{ marginBottom: '8px', color: 'var(--text-loud)', fontSize: '16px' }}>Comprehensive Creative Analysis</h4>
      <p style={{ color: 'var(--text-muted)' }}>{isGoogle ? 'Responsive Search Ads and YouTube bumpers are dominating engagement.' : 'High-production video assets continue to dominate engagement metrics.'}</p>
    </div>

    <div>
      <div className="section-header" style={{ paddingLeft: 0 }}>1. Format Performance (Aggregated)</div>
      <table className="report-table">
        <thead>
          <tr>
            <th>Ad Format</th>
            <th>Avg. CTR</th>
            <th>Avg. CPC</th>
            <th>Lead Conv. Rate</th>
            <th>Fatigue Index</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{isGoogle ? 'Responsive Search Ads' : 'Video Walkthroughs'}</td>
            <td>{isGoogle ? '8.2%' : '4.8%'}</td>
            <td>$1.45</td>
            <td>12.4%</td>
            <td style={{ color: 'var(--accent-primary)' }}>Low</td>
          </tr>
          <tr>
            <td>{isGoogle ? 'YouTube Bumpers' : 'Static Carousels (Galleries)'}</td>
            <td>2.4%</td>
            <td>$1.10</td>
            <td>7.2%</td>
            <td style={{ color: 'var(--text-muted)' }}>Moderate</td>
          </tr>
          <tr>
            <td>{isGoogle ? 'Display Image (Exteriors)' : 'Single Image (Exteriors)'}</td>
            <td>1.8%</td>
            <td>$0.95</td>
            <td>4.1%</td>
            <td style={{ color: '#e11d48' }}>High</td>
          </tr>
          <tr>
            <td>{isGoogle ? 'Performance Max' : 'Agent Testimonial Reels'}</td>
            <td>3.9%</td>
            <td>$1.65</td>
            <td>10.8%</td>
            <td style={{ color: 'var(--text-muted)' }}>Moderate</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div>
      <div className="section-header" style={{ paddingLeft: 0 }}>2. Top 5 Individual Creatives (By ROAS)</div>
      <table className="report-table">
        <thead>
          <tr>
            <th>Creative Asset ID</th>
            <th>Type</th>
            <th>Primary Hook</th>
            <th>Cost / Lead</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{isGoogle ? 'SRC_Luxury_Keywords' : 'VID_Penthouse_Sunset_01'}</td>
            <td>{isGoogle ? 'Search' : 'Reel'}</td>
            <td>{isGoogle ? 'High Intent Keywords' : '"Imagine waking up to this view..."'}</td>
            <td>$32.50</td>
          </tr>
          <tr>
            <td>{isGoogle ? 'PMAX_Suburban_03' : 'CAR_Suburban_Schools_03'}</td>
            <td>{isGoogle ? 'PMax' : 'Carousel'}</td>
            <td>Top rated school districts highlighted</td>
            <td>$38.10</td>
          </tr>
          <tr>
            <td>{isGoogle ? 'YT_Agent_Market_Update' : 'VID_Agent_Market_Update'}</td>
            <td>Video</td>
            <td>"Is it a buyer's market?" (Educational)</td>
            <td>$41.25</td>
          </tr>
          <tr>
            <td>IMG_Modern_Kitchen_A</td>
            <td>Static</td>
            <td>Luxury finishings close-up</td>
            <td>$45.00</td>
          </tr>
          <tr>
            <td>{isGoogle ? 'YT_Commercial_Drone_01' : 'VID_Commercial_Drone_01'}</td>
            <td>Video</td>
            <td>Drone flyover of business park</td>
            <td>$110.00</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div>
      <div className="section-header" style={{ paddingLeft: 0 }}>3. Copywriting A/B Test Results</div>
      <table className="report-table">
        <thead>
          <tr>
            <th>Copy Variant</th>
            <th>Angle</th>
            <th>Click-to-Lead %</th>
            <th>Winner</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Variant A</td>
            <td>Emotional ("Find your forever home")</td>
            <td>8.5%</td>
            <td></td>
          </tr>
          <tr>
            <td>Variant B</td>
            <td>Financial ("Invest in growing equity")</td>
            <td>14.2%</td>
            <td>🏆</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
);

const ReportBestCampaign = ({ isGoogle }: { isGoogle?: boolean }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
    <div>
      <h4 style={{ marginBottom: '8px', color: 'var(--text-loud)', fontSize: '16px' }}>Winning Campaign Deep Dive</h4>
      <p style={{ color: 'var(--text-muted)' }}>Extensive breakdown of our top performer: <strong>Luxury Downtown Condos - Q3</strong>.</p>
    </div>

    <div style={{ padding: '16px', borderLeft: '3px solid var(--accent-primary)', backgroundColor: 'var(--bg-surface)' }}>
      <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 'bold' }}>Winning Ad Copy</div>
      <em style={{ fontSize: '14px', lineHeight: '1.6' }}>
        "Experience skyline views from your private terrace. The Skyline Penthouse collection is now touring. With interest rates shifting, secure your luxury unit before the Q4 price adjustments. Tap to schedule a private, VIP viewing today."
      </em>
    </div>

    <div>
      <div className="section-header" style={{ paddingLeft: 0 }}>1. Audience Demographic Breakdown</div>
      <table className="report-table">
        <thead>
          <tr>
            <th>Demographic Segment</th>
            <th>Impression Share</th>
            <th>Lead Share</th>
            <th>CPL</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Age: 35-44 (Professionals)</td>
            <td>45%</td>
            <td>58%</td>
            <td>$38.50</td>
          </tr>
          <tr>
            <td>Age: 45-54 (Executives)</td>
            <td>30%</td>
            <td>25%</td>
            <td>$45.20</td>
          </tr>
          <tr>
            <td>Age: 25-34 (Tech Workers)</td>
            <td>20%</td>
            <td>15%</td>
            <td>$55.80</td>
          </tr>
          <tr>
            <td>Age: 55+ (Downsizers)</td>
            <td>5%</td>
            <td>2%</td>
            <td>$120.00</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div>
      <div className="section-header" style={{ paddingLeft: 0 }}>2. Time of Day Performance (Heatmap Summary)</div>
      <table className="report-table">
        <thead>
          <tr>
            <th>Time Block</th>
            <th>Engagement Volume</th>
            <th>Conversion Efficiency</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Morning (6AM - 9AM)</td>
            <td>Moderate</td>
            <td style={{ color: 'var(--accent-primary)' }}>High (Before Work)</td>
          </tr>
          <tr>
            <td>Midday (11AM - 2PM)</td>
            <td>Low</td>
            <td>Low</td>
          </tr>
          <tr>
            <td>Evening (6PM - 10PM)</td>
            <td>High</td>
            <td style={{ color: 'var(--accent-primary)' }}>Very High (Peak Browsing)</td>
          </tr>
          <tr>
            <td>Night (10PM - 2AM)</td>
            <td>Very Low</td>
            <td>Poor (Bot Traffic Filtered)</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div>
      <div className="section-header" style={{ paddingLeft: 0 }}>3. Financial ROI Projections</div>
      <table className="report-table">
        <thead>
          <tr>
            <th>Metric</th>
            <th>Actual (To Date)</th>
            <th>Projected (End of Q3)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Total Spend</td>
            <td>$12,450</td>
            <td>$35,000</td>
          </tr>
          <tr>
            <td>Qualified Showings Booked</td>
            <td>42</td>
            <td>115</td>
          </tr>
          <tr>
            <td>Estimated Closings (4% Rate)</td>
            <td>1.68</td>
            <td>4.6</td>
          </tr>
          <tr>
            <td>Est. Gross Commission (Avg $30k)</td>
            <td>$50,400</td>
            <td>$138,000</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
);

const ReportMoMComparison = ({ isGoogle }: { isGoogle?: boolean }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
    <div>
      <h4 style={{ marginBottom: '8px', color: 'var(--text-loud)', fontSize: '16px' }}>Month-over-Month Performance (3 Months)</h4>
      <p style={{ color: 'var(--text-muted)' }}>Historical trend analysis for {isGoogle ? 'Google Ads (Search/YouTube)' : 'Meta Ads (Facebook/Instagram)'}. We observe a steady decrease in Cost Per Lead as machine learning models mature.</p>
    </div>
    
    <div>
      <div className="section-header" style={{ paddingLeft: 0 }}>Quarterly Trend Breakdown</div>
      <table className="report-table">
        <thead>
          <tr>
            <th>Metric</th>
            <th>Month 1 (May)</th>
            <th>Month 2 (June)</th>
            <th>Month 3 (July)</th>
            <th>MoM Growth</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Total Ad Spend</td>
            <td>$8,500</td>
            <td>$10,200</td>
            <td>$12,450</td>
            <td style={{ color: 'var(--accent-primary)' }}>+22%</td>
          </tr>
          <tr>
            <td>Qualified Leads</td>
            <td>145</td>
            <td>198</td>
            <td>245</td>
            <td style={{ color: 'var(--accent-primary)' }}>+24%</td>
          </tr>
          <tr>
            <td>Cost Per Lead (CPL)</td>
            <td>$58.62</td>
            <td>$51.51</td>
            <td>$50.81</td>
            <td style={{ color: 'var(--accent-primary)' }}>-13% (Improved)</td>
          </tr>
          <tr>
            <td>Estimated ROAS</td>
            <td>2.8x</td>
            <td>3.4x</td>
            <td>4.1x</td>
            <td style={{ color: 'var(--accent-primary)' }}>+46%</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
);

const ReportKeyword = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
    <div>
      <h4 style={{ marginBottom: '8px', color: 'var(--text-loud)', fontSize: '16px' }}>Target Keyword Analysis (Top 20)</h4>
      <p style={{ color: 'var(--text-muted)' }}>Search term performance and volume metrics for our primary real estate acquisition targets.</p>
    </div>
    
    <div>
      <div className="section-header" style={{ paddingLeft: 0 }}>Keyword Performance Data</div>
      <table className="report-table">
        <thead>
          <tr>
            <th>Target Keyword</th>
            <th>Search Vol. (Mo)</th>
            <th>Avg. CPC</th>
            <th>Competition</th>
            <th>Est. CTR</th>
            <th>Conv. Rate</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>luxury condos downtown</td><td>12,500</td><td>$4.50</td><td style={{ color: '#e11d48' }}>High</td><td>4.2%</td><td>2.1%</td></tr>
          <tr><td>homes for sale near me</td><td>145,000</td><td>$2.15</td><td style={{ color: '#e11d48' }}>High</td><td>5.1%</td><td>1.8%</td></tr>
          <tr><td>real estate agent</td><td>88,200</td><td>$12.50</td><td style={{ color: '#e11d48' }}>High</td><td>3.8%</td><td>4.5%</td></tr>
          <tr><td>new construction homes</td><td>34,500</td><td>$3.80</td><td style={{ color: 'var(--accent-secondary)' }}>Medium</td><td>4.5%</td><td>3.2%</td></tr>
          <tr><td>open houses this weekend</td><td>42,100</td><td>$1.85</td><td style={{ color: 'var(--accent-primary)' }}>Low</td><td>6.2%</td><td>1.2%</td></tr>
          <tr><td>waterfront properties</td><td>18,400</td><td>$5.20</td><td style={{ color: 'var(--accent-secondary)' }}>Medium</td><td>3.9%</td><td>2.8%</td></tr>
          <tr><td>investment properties</td><td>25,600</td><td>$6.10</td><td style={{ color: '#e11d48' }}>High</td><td>3.1%</td><td>3.5%</td></tr>
          <tr><td>first time home buyer programs</td><td>55,800</td><td>$2.45</td><td style={{ color: 'var(--accent-secondary)' }}>Medium</td><td>7.4%</td><td>5.1%</td></tr>
          <tr><td>commercial real estate for lease</td><td>22,100</td><td>$14.80</td><td style={{ color: '#e11d48' }}>High</td><td>2.5%</td><td>4.2%</td></tr>
          <tr><td>houses with pools</td><td>68,500</td><td>$1.65</td><td style={{ color: 'var(--accent-primary)' }}>Low</td><td>5.8%</td><td>1.5%</td></tr>
          <tr><td>penthouses for sale</td><td>8,400</td><td>$8.90</td><td style={{ color: 'var(--accent-secondary)' }}>Medium</td><td>3.2%</td><td>1.8%</td></tr>
          <tr><td>3 bedroom apartments</td><td>92,000</td><td>$2.20</td><td style={{ color: '#e11d48' }}>High</td><td>4.8%</td><td>2.5%</td></tr>
          <tr><td>multi family homes</td><td>29,500</td><td>$5.60</td><td style={{ color: 'var(--accent-secondary)' }}>Medium</td><td>3.4%</td><td>3.8%</td></tr>
          <tr><td>property management companies</td><td>31,200</td><td>$18.50</td><td style={{ color: '#e11d48' }}>High</td><td>2.1%</td><td>5.5%</td></tr>
          <tr><td>suburban homes for sale</td><td>45,600</td><td>$3.20</td><td style={{ color: 'var(--accent-secondary)' }}>Medium</td><td>4.1%</td><td>2.4%</td></tr>
          <tr><td>gated community homes</td><td>15,800</td><td>$4.80</td><td style={{ color: 'var(--accent-secondary)' }}>Medium</td><td>3.7%</td><td>2.1%</td></tr>
          <tr><td>condos with amenities</td><td>12,400</td><td>$3.50</td><td style={{ color: 'var(--accent-primary)' }}>Low</td><td>4.5%</td><td>2.6%</td></tr>
          <tr><td>modern townhomes</td><td>19,500</td><td>$3.90</td><td style={{ color: 'var(--accent-secondary)' }}>Medium</td><td>4.2%</td><td>2.9%</td></tr>
          <tr><td>cheap homes for sale</td><td>110,000</td><td>$1.15</td><td style={{ color: '#e11d48' }}>High</td><td>6.5%</td><td>0.8%</td></tr>
          <tr><td>real estate broker</td><td>41,500</td><td>$11.20</td><td style={{ color: '#e11d48' }}>High</td><td>2.8%</td><td>4.1%</td></tr>
        </tbody>
      </table>
    </div>
  </div>
);

type Message = { id: string; role: 'user' | 'agent'; content: React.ReactNode; status?: 'processing' | 'complete'; stepText?: string };

export default function MarketingAgentsPage() {
  const [activeAgent, setActiveAgent] = useState(marketingAgents[0]);
  const [deployedAgents, setDeployedAgents] = useState<any[]>([]);
  const [activeViewMode, setActiveViewMode] = useState<'config' | 'chat'>('config');

  const [deployingAgentId, setDeployingAgentId] = useState<string | null>(null);
  const [deployPhase, setDeployPhase] = useState<string>('');
  
  const [chatHistory, setChatHistory] = useState<Record<string, Message[]>>({});
  const [inputText, setInputText] = useState('');

  const handleDeployAgent = () => {
    setDeployingAgentId(activeAgent.id);
    setDeployPhase('Connecting MCP server...');
    
    setTimeout(() => {
      setDeployPhase('Fetching current campaign data...');
      
      setTimeout(() => {
        setDeployPhase('Verifying reports...');
        
        setTimeout(() => {
          if (!deployedAgents.find(a => a.id === activeAgent.id)) {
            setDeployedAgents(prev => [...prev, activeAgent]);
            setChatHistory(prev => ({
              ...prev,
              [activeAgent.id]: [{
                id: Date.now().toString(),
                role: 'agent',
                content: 'I am deployed and connected to the execution engine. What campaign would you like to run today?'
              }]
            }));
          }
          setDeployingAgentId(null);
          setDeployPhase('');
          setActiveViewMode('chat');
        }, 3000);
      }, 3000);
    }, 3000);
  };

  const handleDisconnectAgent = (agentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeployedAgents(prev => prev.filter(a => a.id !== agentId));
    if (activeAgent.id === agentId) {
      setActiveViewMode('config');
    }
  };

  const handlePillClick = (promptIndex: number) => {
    const prompts = [
      "Give me a current dashboard of all the ads running",
      "Which creatives are doing best?",
      "Which is the best performing campaign and copy?"
    ];
    const userPrompt = prompts[promptIndex];
    
    const userId = Date.now().toString();
    const agentIdMsg = (Date.now() + 1).toString();
    
    setChatHistory(prev => {
      const history = prev[activeAgent.id] || [];
      return {
        ...prev,
        [activeAgent.id]: [
          ...history,
          { id: userId, role: 'user', content: userPrompt },
          { id: agentIdMsg, role: 'agent', status: 'processing', stepText: 'Querying Data Contexthouse...', content: '' }
        ]
      };
    });

    const isGoogle = activeAgent.id === 'google-ads-manager';

    setTimeout(() => {
      setChatHistory(prev => {
        const history = [...(prev[activeAgent.id] || [])];
        const lastMsg = history[history.length - 1];
        if (lastMsg && lastMsg.status === 'processing') lastMsg.stepText = 'Analyzing Real Estate Campaigns...';
        return { ...prev, [activeAgent.id]: history };
      });
      
      setTimeout(() => {
        setChatHistory(prev => {
          const history = [...(prev[activeAgent.id] || [])];
          const lastMsg = history[history.length - 1];
          if (lastMsg && lastMsg.status === 'processing') lastMsg.stepText = 'Synthesizing Performance Metrics...';
          return { ...prev, [activeAgent.id]: history };
        });
        
        setTimeout(() => {
          setChatHistory(prev => {
            const history = [...(prev[activeAgent.id] || [])];
            const lastMsg = history[history.length - 1];
            if (lastMsg && lastMsg.status === 'processing') {
              lastMsg.status = 'complete';
              lastMsg.content = promptIndex === 0 ? <ReportDashboard isGoogle={isGoogle} /> : promptIndex === 1 ? <ReportCreatives isGoogle={isGoogle} /> : <ReportBestCampaign isGoogle={isGoogle} />;
            }
            return { ...prev, [activeAgent.id]: history };
          });
        }, 3000);
      }, 3000);
    }, 3000);
  };

  const handleChatSubmit = () => {
    if (!inputText.trim()) return;
    const userPrompt = inputText.trim();
    setInputText('');
    
    const userId = Date.now().toString();
    const agentIdMsg = (Date.now() + 1).toString();
    
    setChatHistory(prev => {
      const history = prev[activeAgent.id] || [];
      return {
        ...prev,
        [activeAgent.id]: [
          ...history,
          { id: userId, role: 'user', content: userPrompt },
          { id: agentIdMsg, role: 'agent', status: 'processing', stepText: 'Querying Data Contexthouse...', content: '' }
        ]
      };
    });

    const isGoogle = activeAgent.id === 'google-ads-manager';
    const isKeywordReport = userPrompt.toLowerCase().includes('keyword report');

    setTimeout(() => {
      setChatHistory(prev => {
        const history = [...(prev[activeAgent.id] || [])];
        const lastMsg = history[history.length - 1];
        if (lastMsg && lastMsg.status === 'processing') {
            lastMsg.stepText = isKeywordReport ? 'Extracting Search Volume Data...' : 'Analyzing Real Estate Campaigns...';
        }
        return { ...prev, [activeAgent.id]: history };
      });
      
      setTimeout(() => {
        setChatHistory(prev => {
          const history = [...(prev[activeAgent.id] || [])];
          const lastMsg = history[history.length - 1];
          if (lastMsg && lastMsg.status === 'processing') {
              lastMsg.stepText = isKeywordReport ? 'Formatting Keyword Metrics...' : 'Synthesizing Performance Metrics...';
          }
          return { ...prev, [activeAgent.id]: history };
        });
        
        setTimeout(() => {
          setChatHistory(prev => {
            const history = [...(prev[activeAgent.id] || [])];
            const lastMsg = history[history.length - 1];
            if (lastMsg && lastMsg.status === 'processing') {
              lastMsg.status = 'complete';
              lastMsg.content = isKeywordReport ? <ReportKeyword /> : <ReportMoMComparison isGoogle={isGoogle} />;
            }
            return { ...prev, [activeAgent.id]: history };
          });
        }, 3000);
      }, 3000);
    }, 3000);
  };

  const availableAgents = marketingAgents.filter(
    agent => !deployedAgents.find(a => a.id === agent.id)
  );

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <header className="top-header">
          <div className="header-breadcrumbs">
            <span className="muted">Execution</span> / <span className="active-breadcrumb">Marketing Agents</span>
          </div>
          <div className="header-actions">
            <ThemeToggle />
            <div className="avatar">AD</div>
          </div>
        </header>

        <div className="agents-wrapper">
          {/* Left Column: Catalog */}
          <div className="agents-catalog">
            <div className="catalog-header">
              <h3><Megaphone size={16}/> Marketing Swarm</h3>
            </div>
            
            <div className="agent-list">
              {/* Deployed Swarm */}
              {deployedAgents.length > 0 && (
                <>
                  <div className="section-header">Deployed Agents</div>
                  {deployedAgents.map(agent => (
                    <div 
                      key={agent.id} 
                      className={`agent-row ${activeAgent.id === agent.id && activeViewMode === 'chat' ? 'selected' : ''}`}
                      onClick={() => {
                        setActiveAgent(agent);
                        setActiveViewMode('chat');
                      }}
                      style={{ paddingRight: '12px' }}
                    >
                      <div className="agent-row-info">
                        <div className="agent-icon" style={{ backgroundColor: agent.color + '20', color: agent.color }}>
                          {agent.emoji}
                        </div>
                        <span className="agent-name" style={{ fontSize: '13px' }}>{agent.name}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="status-indicator status-active"></div>
                        <button 
                          className="disconnect-btn" 
                          onClick={(e) => handleDisconnectAgent(agent.id, e)}
                          title="Disconnect Agent"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '4px',
                            borderRadius: '4px'
                          }}
                        >
                          <PowerOff size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                  <div style={{ height: '12px' }}></div>
                </>
              )}

              {/* Available Swarm */}
              {availableAgents.length > 0 && (
                <>
                  <div className="section-header">Available Swarm</div>
                  {availableAgents.map(agent => (
                    <div 
                      key={agent.id} 
                      className={`agent-row ${activeAgent.id === agent.id && activeViewMode === 'config' ? 'selected' : ''}`}
                      onClick={() => {
                        if (deployingAgentId) return; // Prevent switching while deploying
                        setActiveAgent(agent);
                        setActiveViewMode('config');
                      }}
                      style={{ opacity: deployingAgentId && activeAgent.id !== agent.id ? 0.5 : 1 }}
                    >
                      <div className="agent-row-info">
                        <div className="agent-icon" style={{ backgroundColor: agent.color + '20', color: agent.color }}>
                          {agent.emoji}
                        </div>
                        <span className="agent-name" style={{ fontSize: '13px' }}>{agent.name}</span>
                      </div>
                      <div className="status-indicator status-idle"></div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Right Column: Configuration Workspace */}
          <div className="agent-workspace">
            <div className="workspace-header">
              <div className="workspace-title">
                <div className="accent-icon" style={{ fontSize: '24px', backgroundColor: activeAgent.color + '20', color: activeAgent.color, padding: '12px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {activeAgent.emoji}
                </div>
                <div>
                  <h2>{activeAgent.name}</h2>
                  <div className="workspace-meta">
                    {activeViewMode === 'chat' ? (
                      <span className="badge-status status-active">ACTIVE</span>
                    ) : deployingAgentId === activeAgent.id ? (
                      <span className="badge-status status-active" style={{ backgroundColor: 'var(--accent-secondary)', color: '#000' }}>INITIALIZING</span>
                    ) : (
                      <span className="badge-status status-idle">IDLE</span>
                    )}
                    <span className="meta-id">ID: {activeAgent.id}_prod</span>
                  </div>
                </div>
              </div>
              <div className="workspace-actions">
                {activeViewMode === 'config' && (
                  <>
                    <button className="btn-secondary" disabled={deployingAgentId === activeAgent.id}>View Logs</button>
                    <button 
                      className="btn-primary" 
                      onClick={handleDeployAgent}
                      disabled={deployingAgentId === activeAgent.id}
                      style={{ minWidth: '140px', gap: '8px' }}
                    >
                      {deployingAgentId === activeAgent.id ? (
                        <>
                          <Loader2 size={14} className="spin" />
                          <span style={{ fontSize: '12px' }}>{deployPhase}</span>
                        </>
                      ) : 'Deploy Agent'}
                    </button>
                  </>
                )}
                {activeViewMode === 'chat' && (
                  <button className="btn-secondary" onClick={() => setActiveViewMode('config')}>Agent Config</button>
                )}
              </div>
            </div>

            {activeViewMode === 'config' ? (
              <div className="config-grid">
                <div className="config-panel full-width">
                   <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{activeAgent.description}</p>
                   {activeAgent.vibe && (
                     <p style={{ fontSize: '12px', color: 'var(--text-default)', marginTop: '8px', padding: '8px', backgroundColor: 'var(--bg-app)', borderRadius: '4px', borderLeft: `3px solid ${activeAgent.color}` }}>
                       <strong>Vibe:</strong> {activeAgent.vibe}
                     </p>
                   )}
                </div>

                {/* Context Assignment */}
                <div className="config-panel">
                  <div className="panel-title">
                    <DatabaseIcon size={16} /> Data Contexthouse Assignment
                  </div>
                  <div className="context-card">
                    <span className="table-name">marketing_analytics_db</span>
                    <span className="table-access">READ_WRITE</span>
                  </div>
                  <p className="panel-hint">This agent grounds its memory strictly on this Lakehouse asset.</p>
                </div>

                {/* MCP Tools */}
                <div className="config-panel">
                  <div className="panel-title">
                    <Plug size={16}/> Assigned Capabilities
                  </div>
                  <div className="mcp-list">
                    {activeAgent.tools && activeAgent.tools.length > 0 ? activeAgent.tools.map((srv: string) => (
                      <div key={srv} className="mcp-card">
                        <div className="mcp-status"></div>
                        {srv}
                      </div>
                    )) : <p className="panel-hint">No specific tools assigned.</p>}
                  </div>
                </div>

                {/* System Prompt (Full Width) */}
                <div className="config-panel full-width" style={{ flex: 1 }}>
                  <div className="panel-title">
                    <TerminalSquare size={16}/> System Directive (Imported Profile)
                  </div>
                  <div className="code-editor" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                    <div className="editor-lines">
                      {activeAgent.prompt.split('\n').map((_: string, i: number) => <React.Fragment key={i}>{i + 1}<br/></React.Fragment>)}
                    </div>
                    <pre className="editor-code" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', flex: 1, minWidth: 0 }}>
                      <code>
                        {activeAgent.prompt}
                      </code>
                    </pre>
                  </div>
                </div>
              </div>
            ) : (
              <div className="chat-interface">
                <div className="chat-history">
                  {(chatHistory[activeAgent.id] || []).map(msg => (
                    <div key={msg.id} className={`chat-bubble ${msg.role}`}>
                      {msg.role === 'agent' && (
                        <div className="bubble-avatar" style={{ backgroundColor: activeAgent.color + '20', color: activeAgent.color }}>
                          {activeAgent.emoji}
                        </div>
                      )}
                      <div className="bubble-content" style={msg.role === 'agent' ? { borderLeft: `3px solid ${activeAgent.color}`, minWidth: '200px' } : {}}>
                        {msg.status === 'processing' ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div className="typing-dots"><span></span><span></span><span></span></div>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{msg.stepText}</span>
                          </div>
                        ) : (
                          msg.content
                        )}
                      </div>
                      {msg.role === 'user' && (
                        <div className="bubble-avatar" style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-app)' }}>
                          <User size={16} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="chat-input-wrapper">
                  <div className="chat-suggestions" style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                    <button className="suggestion-pill" onClick={() => handlePillClick(0)}>Give me a current dashboard of all the ads running</button>
                    <button className="suggestion-pill" onClick={() => handlePillClick(1)}>Which creatives are doing best?</button>
                    <button className="suggestion-pill" onClick={() => handlePillClick(2)}>Which is the best performing campaign and copy?</button>
                  </div>
                  <div className="chat-input-box" style={{ padding: '12px 16px', alignItems: 'flex-end', minHeight: '80px' }}>
                    <textarea 
                      placeholder={`Message ${activeAgent.name}...`} 
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleChatSubmit();
                        }
                      }}
                      style={{ 
                        flex: 1, 
                        background: 'transparent', 
                        border: 'none', 
                        outline: 'none', 
                        color: 'var(--text-loud)', 
                        fontSize: '14px', 
                        resize: 'none',
                        height: '60px',
                        fontFamily: 'inherit',
                        lineHeight: '1.5'
                      }}
                    />
                    <button className="chat-submit-btn" onClick={handleChatSubmit} style={{ marginBottom: '8px' }}>
                      <Send size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
