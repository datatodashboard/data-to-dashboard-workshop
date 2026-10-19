import { ArrowRight, Award, CalendarDays, CheckCircle2, Clock3, Database, IndianRupee, Laptop2, LineChart, Sparkles } from "lucide-react";
import { RegistrationForm } from "@/components/registration-form";

const outcomes = [
  "Write clear SELECT queries from real business questions",
  "Filter, sort and summarize data confidently",
  "Connect tables using JOINs without confusion",
  "Use GROUP BY and analytical functions for insights",
];

export default function Home() {
  return (
    <main>
      <section className="hero-shell">
        <div className="nav-row">
          <a className="brand" href="#top" aria-label="Data to Dashboard home"><span className="brand-mark">D2D</span><span>Data to Dashboard</span></a>
          <a className="nav-cta" href="#register">Reserve your seat <small>• பதிவு செய்யுங்கள்</small></a>
        </div>
        <div id="top" className="hero-grid">
          <div className="hero-copy">
            <div className="eyebrow"><Sparkles size={15} /> Live • Beginner-friendly • Tamil + English</div>
            <h1>Turn business questions into <span>working SQL.</span></h1>
            <p className="tamil-hero">தரவிலிருந்து தெளிவான பதிலை SQL மூலம் கண்டறியுங்கள்.</p>
            <p className="hero-lead">A focused 3-hour workshop that helps you think through data problems, build queries step by step and understand the result—not just copy syntax.</p>
            <div className="event-strip" aria-label="Workshop details">
              <div><CalendarDays /><span><strong>13 Sep 2026</strong>Sunday • ஞாயிறு</span></div>
              <div><Clock3 /><span><strong>10 AM–1 PM</strong>3 மணி நேரம்</span></div>
              <div><Laptop2 /><span><strong>Live online</strong>நேரலை + பதிவு</span></div>
            </div>
            <a className="primary-cta" href="#register">Join for ₹999 • இப்போதே பதிவு <ArrowRight size={18} /></a>
            <p className="microcopy">Secure online payment • Confirmation sent instantly</p>
            <aside className="crack-sql-promo" aria-label="Crack SQL practice">
              <h2>Want to Learn SQL Through Your Own Thinking?</h2>
              <p>Think logically. Solve real business scenarios. Master SQL with Crack SQL.</p>
              <a href="https://crack-sql-d2d.netlify.app/" target="_blank" rel="noopener noreferrer">🚀 Try Crack SQL – Practice Now <ArrowRight size={16} aria-hidden="true" /></a>
            </aside>
          </div>
          <div className="sql-card" aria-label="SQL learning example">
            <div className="window-bar"><span /><span /><span /><em>insight.sql</em></div>
            <div className="code-area">
              <p><b>SELECT</b> department,</p><p className="indent"><i>AVG</i>(salary) <b>AS</b> avg_salary</p>
              <p><b>FROM</b> employees</p><p><b>GROUP BY</b> department</p><p><b>ORDER BY</b> avg_salary <b>DESC</b>;</p>
            </div>
            <div className="result-card"><div><LineChart size={18} /><span>Query → insight</span></div><strong>Learn the thinking behind every line.</strong></div>
          </div>
        </div>
      </section>

      <section className="outcome-section">
        <div className="section-heading"><div><p className="kicker">What you will learn • நீங்கள் கற்பவை</p><h2>Three hours. One practical SQL foundation.</h2></div></div>
        <div className="outcome-grid">
          {outcomes.map((outcome, index) => <article key={outcome}><span>0{index + 1}</span><CheckCircle2 size={22} /><p>{outcome}</p></article>)}
        </div>
      </section>

      <section className="included-section">
        <div className="included-copy"><p className="kicker">Included with your seat • உங்களுக்குக் கிடைப்பவை</p><h2>Everything you need to continue practising.</h2><p>Attend live, revisit the recording and use the workshop resources after the session.</p></div>
        <div className="included-list">
          <div><Database /><span><strong>SQL scripts</strong>Ready-to-practise examples</span></div>
          <div><Laptop2 /><span><strong>Session recording</strong>Review after the workshop</span></div>
          <div><Award /><span><strong>Certificate</strong>Issued after participation</span></div>
          <div><IndianRupee /><span><strong>One-time fee</strong>₹999, including all materials</span></div>
        </div>
      </section>

      <section className="mentor-section">
        <div className="mentor-monogram">RJ</div>
        <div><p className="kicker">Your trainer</p><h2>Ramgokul Jeyakumar</h2><p>Data Architect & Trainer with 18+ years of experience in data engineering, warehousing, SQL, ETL/ELT, Azure and Databricks.</p></div>
      </section>

      <section id="register" className="registration-section">
        <div className="registration-copy"><p className="kicker">Sunday, 13 September • ஞாயிறு</p><h2>Reserve your workshop seat.</h2><p className="tamil-register">உங்கள் இடத்தை இப்போதே உறுதி செய்யுங்கள்.</p><p>Complete your details and pay securely. Your registration confirmation and calendar invite will be sent automatically.</p><div className="price-lock"><span>Workshop access • பயிற்சி கட்டணம்</span><strong>₹999</strong></div></div>
        <RegistrationForm />
      </section>
      <footer><div className="brand"><span className="brand-mark">D2D</span><span>Data to Dashboard</span></div><p>Transform Data. Create Impact.</p></footer>
    </main>
  );
}
