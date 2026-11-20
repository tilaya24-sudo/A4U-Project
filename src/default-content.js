/* Initial content follows the uploaded Accel4U website revision proposal.
   Administrators can edit every supported section from the CMS. */
const sec = (id, type, fields = {}) => ({ id, type, visible: true, theme: 'white', align: 'left', ...fields });
const item = (title, body = '', icon = '', mediaUrl = '', subtitle = '') => ({ title, body, icon, mediaUrl, subtitle });

export const PAGE_META = {
  home: { label: 'Home', path: '/' },
  about: { label: 'About Us', path: '/about' },
  solutions: { label: 'Solutions', path: '/solutions' },
  how: { label: 'How To', path: '/how-to' },
  consultation: { label: 'Free Consultation', path: '/free-consultation' }
};

export const SECTION_TYPES = {
  hero: 'Hero / Page Heading',
  split: 'Image + Text',
  cards: 'Cards / Services / Industries',
  steps: 'Steps / Process',
  people: 'Leadership / People',
  banner: 'Call to Action',
  calculator: 'Cost Estimate Calculator',
  contact: 'Consultation Form',
  resources: 'Downloadable Resources',
  media: 'Image / Video Feature'
};

export const INITIAL_SITE = {
  settings: {
    siteName: 'Accel4U Business Solutions Inc.',
    tagline: 'Enabling Growth, Accelerating Success',
    footerNote: 'Your Partner. Your Advantage.',
    logoUrl: '/assets/logo.png',
    colors: { navy: '#111b5f', orange: '#ff7108', blue: '#1555a4', light: '#f6f8fc', ink: '#17213f' },
    font: 'system',
    social: { linkedin: '', facebook: '', instagram: '' },
    calculatorRates: { finance: 1100, apar: 1050, hr: 1000, customer: 950, admin: 900, it: 1200 },
    phpPerUsd: 58,
    calculatorEnabled: true
  },
  pages: {
    home: {
      seoTitle: 'Accel4U | Enabling Growth, Accelerating Success',
      seoDescription: 'Accel4U Business Solutions Inc. provides global outsourcing support in finance, accounting, HR, customer service, administration, and IT.',
      sections: [
        sec('home-hero', 'hero', {
          eyebrow: 'Your Outsourcing Service Partner',
          title: 'Accel4U Business Solutions Inc.',
          subtitle: 'Enabling Growth, Accelerating Success',
          body: 'We handle your workload so you can focus on scaling, improving efficiency, and achieving your goals faster. Outsource to us and accelerate your success.',
          ctaText: 'Learn More About Us', ctaHref: '/about',
          mediaUrl: '/assets/hero-portrait.png', mediaType: 'image', mediaAlt: 'Accel4U professional representative'
        }),
        sec('home-who', 'split', {
          eyebrow: 'Who Are We?', title: 'Your partner for business growth.',
          body: 'Accel4U Business Solutions Inc. is a dynamic and forward-thinking company specializing in top-tier outsourcing services to businesses worldwide. From finance and accounting to HR, customer support, administration, and IT, we build teams around your needs.',
          mediaUrl: '/assets/vision-sport.webp', mediaAlt: 'Basketball entering a hoop under blue sky', ctaText: 'Discover Our Story', ctaHref: '/about', theme: 'light'
        }),
        sec('home-services', 'cards', {
          eyebrow: 'Comprehensive Services', title: 'Solutions designed around your business.',
          body: 'From a single specialist to a dedicated operational team, we tailor outsourcing to your processes.',
          items: [
            item('Finance & Accounting', 'Bookkeeping, management accounting, reporting and financial operations.', '▤'),
            item('Accounts Payable & Receivable', 'Invoice processing, supplier payments, collections and cash application.', '↔'),
            item('HR & Payroll', 'Staffing, HR administration, employee services and payroll processing.', '♙'),
            item('Customer Service Support', 'Professional customer assistance for front-office operations.', '☏'),
            item('Administrative Support', 'Dependable back-office administration and process support.', '▦'),
            item('IT Service Desk', 'Technical service desk and IT-related operational support.', '⌘')
          ]
        }),
        sec('home-global', 'cards', {
          eyebrow: 'Our Difference', title: 'Global expertise. Philippine advantage.', theme: 'navy',
          items: [
            item('Training and Staffing', 'We train and manage employees assigned to your processes.', '✦'),
            item('English Proficiency', 'Clear, effective English communication with your team and customers.', '◉'),
            item('Time Zone Alignment', 'Flexible operations designed around your working hours.', '◷'),
            item('Confidentiality and Ownership', 'Confidential operations, with agreed work products assigned to you.', '◇'),
            item('Server Flexibility', 'Use your infrastructure or our systems, depending on your requirements.', '▣'),
            item('Client Interaction', 'Direct collaboration for process allocation and performance management.', '⇄')
          ]
        }),
        sec('home-steps', 'steps', {
          eyebrow: 'Our Approach', title: 'How we make outsourcing work.', theme: 'light',
          items: [
            item('Identify needs', 'Understand requirements, restrictions and opportunities.', '01'),
            item('Customize solutions', 'Design services around your processes and business goals.', '02'),
            item('Implement solutions', 'Deploy the appropriate team and workflows.', '03'),
            item('Review performance', 'Monitor outcomes and refine service delivery.', '04'),
            item('Enhance collaboration', 'Maintain clear communication and continuous improvement.', '05')
          ]
        }),
        sec('home-calc', 'calculator', {
          eyebrow: 'Planning Tool', title: 'Estimate your outsourcing budget.',
          body: 'Explore illustrative monthly costs based on service, team size and coverage. These are example assumptions, not official Accel4U rates or a quotation.'
        }),
        sec('home-cta', 'banner', {
          eyebrow: 'Ready to get started?', title: 'Let us handle the workload. You focus on growth.',
          body: 'Discuss your operational needs and receive a tailored consultation.', ctaText: 'Get a Free Consultation', ctaHref: '/free-consultation', theme: 'navy'
        })
      ]
    },
    about: {
      seoTitle: 'About Us | Accel4U Business Solutions Inc.',
      seoDescription: 'Learn about Accel4U, our leadership, global expertise, vision, mission, and core values.',
      sections: [
        sec('about-hero', 'hero', {
          eyebrow: 'About Us', title: 'Built to support your next stage of growth.', subtitle: 'A dynamic, forward-thinking outsourcing partner.',
          body: 'Accel4U Business Solutions Inc. specializes in top-tier outsourcing services for businesses worldwide.',
          mediaUrl: '/assets/hero-portrait.png', mediaType: 'image', mediaAlt: 'Accel4U team representative'
        }),
        sec('about-overview', 'split', {
          eyebrow: 'What We Do', title: 'Skilled people. Trusted processes. Worldwide reach.',
          body: 'Our comprehensive solutions include finance, accounting and bookkeeping, management accounting and controlling, HR, payroll, customer service support, administration and IT service desk. Operating from the Philippines, we provide scalable support while maintaining confidentiality, flexible scheduling, and a client-first approach.',
          theme: 'light'
        }),
        sec('about-leadership', 'people', {
          eyebrow: 'Our Team', title: 'Experienced leaders and project specialists.',
          items: [
            item('Irma Bitzer', 'A Certified Public Accountant and BPO accounting and finance process leader with experience in service delivery and process migration.', '', '/assets/irma.png', 'Co-Founder · President and COO (as shown in the proposal)'),
            item('Xcel Visitacion', 'BPO leader with experience in migration, standardization, process improvement and financial operations.', '', '/assets/xcel.png', 'Operations Manager'),
            item('Gerlie Correa', 'Certified Public Accountant with extensive experience in finance operations and ERP systems.', '', '/assets/gerlie.png', 'Operations Lead')
          ]
        }),
        sec('about-vision', 'split', {
          eyebrow: 'What We Stand For', title: 'Our Vision', theme: 'light',
          body: 'To be the outsourcing partner of choice, consistently delivering exceptional value, transforming businesses and supporting the strategic goals of our clients.',
          mediaUrl: '/assets/vision-sport.webp', mediaAlt: 'A vision of reaching goals', reverse: true
        }),
        sec('about-mission', 'split', {
          eyebrow: 'What We Aim For', title: 'Our Mission',
          body: 'Accel4U Business Solutions Inc. empowers businesses with innovative, sustainable and efficient outsourcing solutions. We deliver exceptional service and foster long-term partnerships through excellence, confidentiality, and client satisfaction.'
        }),
        sec('about-values', 'cards', {
          eyebrow: 'Culture', title: 'Our Core Values', theme: 'light',
          items: [
            item('Customer Centricity', 'We put our clients’ goals and needs at the center of our services.', '♡'),
            item('Respect', 'We value diversity, inclusion and empathy.', '◎'),
            item('Innovation', 'We improve processes through fresh ideas and effective technologies.', '✦'),
            item('Integrity', 'We act transparently and uphold confidentiality.', '◇'),
            item('Excellence', 'We aim for quality and continuous improvement.', '★')
          ]
        })
      ]
    },
    solutions: {
      seoTitle: 'Outsourcing Solutions | Accel4U',
      seoDescription: 'Explore flexible engagement models, BPO advantages, skilled teams, industries served, and finance outsourcing offerings.',
      sections: [
        sec('sol-hero', 'hero', {
          eyebrow: 'Solutions', title: 'Outsourcing designed for the way you operate.',
          subtitle: 'Adaptable Engagement Models',
          body: 'Choose dedicated support capacity, back-office services or front-office solutions. We tailor our involvement to your needs, from client-managed capacity to process ownership transfer.',
          ctaText: 'Talk to Our Team', ctaHref: '/free-consultation'
        }),
        sec('sol-models', 'cards', {
          eyebrow: 'How We Engage', title: 'Flexible models to match your goals.', theme: 'light',
          items: [
            item('Dedicated Support / Capacity', 'Your team directs priorities, allocates processes and supervises the dedicated capacity.', '01'),
            item('Back Office', 'Accel4U supports accounting, HR, payroll and administrative processes.', '02'),
            item('Front Office', 'Client-facing and customer service operations tailored to your needs.', '03'),
            item('Process Ownership Transfer', 'Accel4U builds team management capacity for hiring, training, replacement and knowledge transfer.', '04')
          ]
        }),
        sec('sol-benefits', 'cards', {
          eyebrow: 'Business Advantages', title: 'Why businesses choose BPO.',
          items: [
            item('Cost Savings', 'Cost-efficient operations through Philippines-based support.', '₱'),
            item('Expertise and Adaptability', 'Professionals trained to fit your requirements.', '✦'),
            item('Flexible Operations', 'Working hours and server options that support global clients.', '◷'),
            item('Quality Assurance', 'Processes aligned to expected quality and standards.', '✓'),
            item('Business Continuity', 'Documented processes, knowledge retention and succession planning.', '↗'),
            item('Confidentiality', 'Strong confidentiality and clear work product ownership.', '◇')
          ]
        }),
        sec('sol-industries', 'cards', {
          eyebrow: 'Industries We Serve', title: 'Built for businesses across sectors.', theme: 'navy',
          items: [
            item('Retail & Consumer Products', '', '▣'), item('Management Consulting', '', '✦'),
            item('Financial Services & Insurance', '', '▤'), item('Accounting Providers', '', '∑'),
            item('Manufacturing', '', '⚙'), item('Property Management', '', '⌂'),
            item('Food & Restaurants', '', '◉'), item('Startups', '', '↗'),
            item('Technology', '', '⌘'), item('Healthcare', '', '+'),
            item('Tourism', '', '✈'), item('E-Commerce', '', '▦'),
            item('Construction & Engineering', '', '△'), item('Service Businesses', '', '◈')
          ]
        }),
        sec('sol-finance', 'cards', {
          eyebrow: 'Finance Operations', title: 'Sample bundled finance offerings.',
          body: 'Select a process or combine services into a tailored engagement.',
          items: [
            item('Procure to Pay (P2P)', 'Supplier selection, purchase orders, invoice processing and payments.', '✓'),
            item('Order to Cash (O2C)', 'Order management, invoicing, collections and cash applications.', '✓'),
            item('Record to Report (R2R)', 'Reconciliation, adjustments, financial reporting and compliance.', '✓'),
            item('Financial Planning & Analysis', 'Budgeting, forecasts and variance analysis.', '✓'),
            item('Internal Audit & Finance Controls', 'Controls, risk assessments, audit execution and reporting.', '✓'),
            item('Treasury Management', 'Cash, debt, investment and banking relationships.', '✓'),
            item('Cost & Asset Management', 'Cost analysis, tracking, depreciation and asset valuation.', '✓'),
            item('HR Operations & Payroll', 'Employee administration, benefits and payroll processing.', '✓')
          ]
        }),
        sec('sol-tools', 'cards', {
          eyebrow: 'Systems Experience', title: 'Finance platforms our professionals know.', theme: 'light',
          items: [item('SAP', '', 'S'), item('QuickBooks', '', 'Q'), item('Xero', '', 'X'), item('NetSuite', '', 'N')]
        }),
        sec('sol-cta', 'banner', {
          eyebrow: 'Let’s collaborate', title: 'Start with the processes you need to improve.',
          ctaText: 'Request a Consultation', ctaHref: '/free-consultation', theme: 'navy'
        })
      ]
    },
    how: {
      seoTitle: 'How It Works | Accel4U',
      seoDescription: 'See the Accel4U engagement approach: identify needs, customize solutions, implement processes, review performance, and collaborate.',
      sections: [
        sec('how-hero', 'hero', {
          eyebrow: 'How To', title: 'A clear approach. A team built around you.',
          subtitle: 'From discovery to ongoing improvement.',
          body: 'We work closely with clients to understand needs, allocate processes, establish responsibilities and agree on deliverables.',
          ctaText: 'Start a Conversation', ctaHref: '/free-consultation'
        }),
        sec('how-process', 'steps', {
          eyebrow: 'Our Approach', title: 'Five steps from planning to progress.', theme: 'light',
          items: [
            item('Identify Needs', 'Assess client requirements and opportunities.', '01'),
            item('Customize Solutions', 'Design services around your specific needs.', '02'),
            item('Implement Solutions', 'Deploy solutions through structured onboarding and integration.', '03'),
            item('Review Performance', 'Monitor service quality, client satisfaction and outcomes.', '04'),
            item('Enhance Collaboration', 'Keep communication strong and improve together.', '05')
          ]
        }),
        sec('how-leads', 'people', {
          eyebrow: 'Project Leads', title: 'Guided by experienced people.',
          items: [
            item('Irma Bitzer', 'CPA and expert in BPO accounting and finance process leadership.', '', '/assets/irma.png', 'Co-Founder · President and COO (proposal)'),
            item('Xcel Visitacion', 'Experienced BPO operations manager focused on process migration and improvement.', '', '/assets/xcel.png', 'Operations Manager'),
            item('Gerlie Correa', 'CPA with experience in finance operations and ERP systems.', '', '/assets/gerlie.png', 'Operations Lead')
          ]
        }),
        sec('how-delivery', 'cards', {
          eyebrow: 'Tailored Solutions', title: 'Clear responsibilities. Lasting partnerships.', theme: 'light',
          items: [
            item('Understand Client Needs', 'Tailored services based on your business requirements.', '✓'),
            item('Allocate Processes', 'Agree on which processes each team performs.', '✓'),
            item('Define Responsibilities', 'Establish transparent ownership and segregation of duties.', '✓'),
            item('Agree Service Levels', 'Define expectations and measurable outcomes.', '✓'),
            item('Manage Data and Servers', 'Use the infrastructure and data processes that suit your setup.', '✓'),
            item('Respect Ownership', 'Agree on work-product rights and confidentiality.', '✓')
          ]
        }),
        sec('how-cta', 'banner', {
          eyebrow: 'Next Step', title: 'Discover how Accel4U can support your business.',
          ctaText: 'Get a Free Consultation', ctaHref: '/free-consultation', theme: 'navy'
        })
      ]
    },
    consultation: {
      seoTitle: 'Free Consultation | Accel4U',
      seoDescription: 'Request a free outsourcing consultation with Accel4U Business Solutions Inc.',
      sections: [
        sec('contact-hero', 'hero', {
          eyebrow: 'Free Consultation', title: 'Interested in learning more?',
          subtitle: 'Tell us about your business needs.',
          body: 'Send us your free consultation request, and our team will get in touch with you as soon as possible.'
        }),
        sec('contact-form', 'contact', {
          eyebrow: 'Let’s Talk', title: 'Start your conversation with Accel4U.',
          body: 'Tell us about your organization, preferred contact method, and how we can help. Your inquiry is stored securely for our team to review.', theme: 'light'
        })
      ]
    }
  }
};

export function makeSection(type) {
  const id = `${type}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  return sec(id, type, {
    eyebrow: '', title: SECTION_TYPES[type] || 'New Section', body: '', subtitle: '',
    ctaText: '', ctaHref: '/free-consultation', mediaUrl: '', mediaType: 'image', mediaAlt: '',
    items: ['cards', 'steps', 'people', 'resources'].includes(type) ? [item('New item', 'Add a description')] : [],
    theme: 'white'
  });
}
