import { PDFParse } from 'pdf-parse';

const KNOWN_SKILLS = [
  'React', 'React.js', 'React Native', 'Node.js', 'Node', 'TypeScript', 'JavaScript', 'Python',
  'Java', 'C++', 'C#', '.NET', 'Go', 'Golang', 'Rust', 'Ruby', 'Ruby on Rails', 'PHP', 'Laravel',
  'SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch', 'DynamoDB', 'Cassandra',
  'Docker', 'Kubernetes', 'AWS', 'Amazon Web Services', 'Azure', 'GCP', 'Google Cloud',
  'Git', 'GitHub', 'GitLab', 'CI/CD', 'Jenkins', 'Terraform', 'Ansible', 'Linux',
  'GraphQL', 'REST API', 'RESTful APIs', 'Microservices', 'System Design', 'Serverless',
  'Next.js', 'Nuxt.js', 'Vue', 'Vue.js', 'Angular', 'Svelte', 'Tailwind CSS', 'Tailwind',
  'Bootstrap', 'HTML5', 'CSS3', 'Sass', 'Webpack', 'Vite',
  'Redux', 'Zustand', 'MobX', 'RxJS', 'Express', 'Express.js', 'NestJS', 'FastAPI', 'Django', 'Flask',
  'Spring Boot', 'Hibernate', 'Kafka', 'RabbitMQ', 'Socket.io', 'WebSockets',
  'Figma', 'Adobe XD', 'UI/UX', 'Product Design', 'Wireframing', 'Prototyping',
  'Machine Learning', 'Deep Learning', 'Data Science', 'PyTorch', 'TensorFlow', 'NLP', 'Computer Vision',
  'Pandas', 'NumPy', 'Scikit-learn', 'Tableau', 'Power BI', 'ETL', 'Apache Spark',
  'Agile', 'Scrum', 'Kanban', 'Jira', 'Confluence', 'Trello', 'Project Management',
  'Quality Assurance', 'Unit Testing', 'Jest', 'Mocha', 'Cypress', 'Playwright', 'Selenium',
  'Cybersecurity', 'OAuth', 'JWT', 'Penetration Testing', 'SOC2', 'GDPR', 'Compliance'
];

export interface ParsedResumeResult {
  text: string;
  extractedSkills: string[];
  estimatedExperienceYears: number;
  extractedEmail?: string;
  extractedPhone?: string;
}

export async function parsePdfResume(pdfBuffer: Buffer): Promise<ParsedResumeResult> {
  let text = '';
  try {
    const uint8 = new Uint8Array(pdfBuffer);
    const parser = new (PDFParse as any)(uint8);
    const data = await parser.getText();
    text = (data?.text || '').replace(/\s+/g, ' ').trim();
  } catch (parseErr) {
    // Graceful fallback to raw ASCII extraction
    text = pdfBuffer.toString('latin1').replace(/[^\x20-\x7E\n]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  try {

    const lowerText = text.toLowerCase();
    const extractedSkillsSet = new Set<string>();

    for (const skill of KNOWN_SKILLS) {
      const lowerSkill = skill.toLowerCase();
      const escaped = lowerSkill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(?:^|[^a-zA-Z0-9#+])${escaped}(?:$|[^a-zA-Z0-9#+])`, 'i');
      if (regex.test(lowerText)) {
        extractedSkillsSet.add(skill);
      }
    }

    let estimatedExperienceYears = 0;
    const expRegexes = [
      /(\d+)\+?\s*(?:years?|yrs?)(?:\s+of)?\s+experience/i,
      /experience\s*:\s*(\d+)\+?\s*(?:years?|yrs?)/i,
      /total\s+experience\s*:\s*(\d+)\+?\s*(?:years?|yrs?)/i,
    ];

    for (const rx of expRegexes) {
      const match = text.match(rx);
      if (match && match[1]) {
        const val = parseInt(match[1], 10);
        if (val > 0 && val < 40) {
          estimatedExperienceYears = Math.max(estimatedExperienceYears, val);
        }
      }
    }

    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const extractedEmail = emailMatch ? emailMatch[0].toLowerCase() : undefined;

    const phoneMatch = text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\+?91[-.\s]?[6-9]\d{9}/);
    const extractedPhone = phoneMatch ? phoneMatch[0].trim() : undefined;

    return {
      text,
      extractedSkills: Array.from(extractedSkillsSet),
      estimatedExperienceYears,
      extractedEmail,
      extractedPhone,
    };
  } catch (error: any) {
    console.error('Failed to parse PDF resume:', error);
    return {
      text: '',
      extractedSkills: [],
      estimatedExperienceYears: 0,
    };
  }
}