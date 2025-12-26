import { Link } from "react-router-dom";
import { Phone, Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AnimatedSection } from "@/hooks/useScrollAnimation";
import logo from "@/assets/logo.avif";

const FAQ = () => {
  const faqs = [
    {
      question: "מה כולל ביטוח נסיעות לחו״ל?",
      answer: "ביטוח נסיעות לחו״ל כולל כיסוי להוצאות רפואיות, אשפוז, תרופות, פינוי רפואי, ביטול או קיצור נסיעה, אובדן או עיכוב כבודה, ועוד. הכיסוי המדויק תלוי בפוליסה שנבחרה ובהרחבות הנוספות."
    },
    {
      question: "עד כמה זמן לפני הנסיעה אפשר לרכוש ביטוח?",
      answer: "ניתן לרכוש ביטוח נסיעות עד רגע לפני היציאה מהארץ. עם זאת, מומלץ לרכוש את הביטוח מוקדם יותר כדי ליהנות מכיסוי לביטול נסיעה מסיבות רפואיות."
    },
    {
      question: "האם יש כיסוי למצבים רפואיים קיימים?",
      answer: "כן, ברוב הפוליסות יש כיסוי להחמרה פתאומית ובלתי צפויה של מצב רפואי קיים. חשוב לציין את המצבים הרפואיים הקיימים בעת הרכישה ולבדוק את תנאי הפוליסה."
    },
    {
      question: "מה הכיסוי המקסימלי בביטוח נסיעות?",
      answer: "הכיסוי המקסימלי להוצאות רפואיות מגיע עד 5 מיליון דולר, תלוי בסוג הפוליסה שנבחרה. כיסויים נוספים כמו כבודה וביטול נסיעה יש להם תקרות נפרדות."
    },
    {
      question: "האם הביטוח מכסה ספורט אתגרי?",
      answer: "ספורט אתגרי וספורט חורף (כמו סקי) דורשים הרחבה מיוחדת לפוליסה. ניתן להוסיף את ההרחבה בעת רכישת הביטוח בתוספת תשלום קטנה."
    },
    {
      question: "מה עושים במקרה חירום בחו״ל?",
      answer: "במקרה חירום יש להתקשר למוקד החירום שלנו הפועל 24/7 בעברית ובאנגלית. המוקד יספק הכוונה רפואית, יתאם טיפול, ויטפל בכל הבירוקרטיה מול בתי החולים והרופאים."
    },
    {
      question: "האם יש כיסוי להריון?",
      answer: "כן, ניתן להוסיף הרחבת הריון לפוליסה עם כיסוי עד 350,000 דולר. ההרחבה תקפה עד שבוע 32 להריון ומכסה סיבוכי הריון ולידה מוקדמת."
    },
    {
      question: "כמה עולה ביטוח נסיעות?",
      answer: "מחיר הביטוח תלוי במספר גורמים: יעד הנסיעה, משך הנסיעה, גיל המבוטחים, והרחבות נוספות שנבחרו. ניתן לקבל הצעת מחיר מיידית באתר שלנו."
    },
    {
      question: "האם יש השתתפות עצמית?",
      answer: "ברוב הפוליסות אין השתתפות עצמית על הוצאות רפואיות. על כיסויים מסוימים כמו כבודה או ביטול נסיעה עשויה להיות השתתפות עצמית קטנה."
    },
    {
      question: "איך מגישים תביעה?",
      answer: "להגשת תביעה יש לשמור את כל הקבלות והאישורים הרפואיים. לאחר החזרה לארץ יש למלא טופס תביעה ולצרף את המסמכים. הצוות שלנו מלווה אתכם לאורך כל התהליך."
    }
  ];

  return (
    <div className="min-h-screen font-heebo" dir="rtl">
      {/* Header */}
      <header className="fixed top-0 right-0 left-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border shadow-sm">
        <div className="container-wide">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <img src={logo} alt="TravelSure לוגו" className="h-10 md:h-12 w-auto" />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <Link to="/#services" className="text-foreground hover:text-primary transition-colors font-medium">שירותים</Link>
              <Link to="/#about" className="text-foreground hover:text-primary transition-colors font-medium">אודות</Link>
              <Link to="/faq" className="text-foreground hover:text-primary transition-colors font-medium">שאלות נפוצות</Link>
              <Link to="/#contact" className="text-foreground hover:text-primary transition-colors font-medium">צור קשר</Link>
            </nav>

            {/* CTA Button */}
            <Link to="/purchase">
              <Button variant="cta" size="default" className="hidden sm:flex">
                <Plane className="w-4 h-4" />
                רכישת ביטוח נסיעות
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Spacer for fixed header */}
      <div className="h-16 md:h-20" />

      {/* Hero */}
      <section className="py-16 md:py-24" style={{ background: 'linear-gradient(135deg, #1a5a5a 0%, #2a7a7a 50%, #3a9a9a 100%)' }}>
        <div className="container-wide text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">שאלות ותשובות</h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            כל מה שרציתם לדעת על ביטוח נסיעות לחו״ל
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="section-padding bg-background">
        <div className="container-wide">
          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AnimatedSection key={index} delay={index * 50} animation="fade-up">
                  <AccordionItem 
                    value={`item-${index}`}
                    className="bg-card rounded-xl border border-border px-6 data-[state=open]:border-secondary/50 data-[state=open]:shadow-lg transition-all"
                  >
                    <AccordionTrigger className="text-right text-lg font-semibold hover:no-underline py-5">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground text-base leading-relaxed pb-5">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                </AnimatedSection>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-muted/50">
        <div className="container-wide text-center">
          <AnimatedSection>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              לא מצאתם תשובה לשאלה שלכם?
            </h2>
            <p className="text-muted-foreground mb-8">
              צרו איתנו קשר ונשמח לעזור
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/purchase">
                <Button variant="cta" size="xl" style={{ background: '#4ade80', color: '#1a5a5a' }}>
                  לרכישת ביטוח נסיעות
                </Button>
              </Link>
              <a href="tel:+972732721111">
                <Button variant="outline" size="xl" className="gap-2">
                  <Phone className="w-5 h-5" />
                  073-2721111
                </Button>
              </a>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-white py-8" style={{ background: 'linear-gradient(135deg, #1a5a5a 0%, #2a7a7a 100%)' }}>
        <div className="container-wide text-center">
          <p className="text-white/70 text-sm">
            © {new Date().getFullYear()} TravelSure - אופיר ושות׳ סוכנות לביטוח. כל הזכויות שמורות.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default FAQ;
