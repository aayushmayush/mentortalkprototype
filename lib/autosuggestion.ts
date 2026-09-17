/**
 * AutosuggestionEngine — verbatim port of
 * `core/lib/shared/autosuggestion/autosuggestion_engine.dart`.
 *
 * Four institution pools tagged by exam (`jee` / `neet` / `cuet` / `ssc`), ten
 * field-of-study pools keyed by degree, and one canonical degree list. The
 * data is copied entry for entry, including the long parenthesised forms
 * ("KGMU Lucknow (King George's Medical University)") — those are what the
 * dropdown actually shows, so shortening them would change the screen.
 *
 * ── The three behaviours worth knowing, all of them the source's ────────────
 *
 * 1. **`suggestInstitutions` is called with NO tags by `add_education_page`.**
 *    The engine supports tag filtering, but the page that uses it passes only
 *    `query:` — so the tag branches are dead in this app. They are ported
 *    anyway rather than dropped, because the day a second call site passes tags
 *    the behaviour is already here and already correct.
 *
 * 2. **An empty query returns everything, SORTED.** `_filter` sorts both
 *    branches, so the pools are not shown in their declared order but
 *    alphabetically. That is why "AIIMS Bhubaneswar" outranks the declaration
 *    order, and it is visible on screen the moment you tap the field.
 *
 * 3. **`10th / SSC` maps to an EMPTY field list**, not to the default. So
 *    choosing that degree leaves the Field of Study dropdown with nothing in
 *    it — a genuinely intentional gap in the source (a 10th-standard student
 *    has no field of study yet) rather than a missing mapping.
 */

const JEE_INSTITUTIONS = [
  'IIT Delhi',
  'IIT Bombay',
  'IIT Madras',
  'IIT Kanpur',
  'IIT Kharagpur',
  'IIT Roorkee',
  'IIT Guwahati',
  'IIT BHU (Varanasi)',
  'IIT Hyderabad',
  'IIT Indore',
  'IIT Dhanbad (ISM)',
  'IIT Mandi',
  'IIT Patna',
  'IIT Jodhpur',
  'IIT Ropar',
  'IIT Gandhinagar',
  'IIT Bhubaneswar',
  'IIT Tirupati',
  'IIT Palakkad',
  'IIT Jammu',
  'IIT Dharwad',
  'NIT Trichy',
  'NIT Surathkal',
  'NIT Warangal',
  'NIT Calicut',
  'NIT Kurukshetra',
  'NIT Rourkela',
  'NIT Durgapur',
  'NIT Allahabad',
  'NIT Jaipur',
  'NIT Nagpur',
  'NIT Patna',
  'NIT Silchar',
  'NIT Hamirpur',
  'NIT Jamshedpur',
  'NIT Agartala',
  'DTU (Delhi Technological University)',
  'NSUT (Netaji Subhas University of Technology)',
  'IIIT Hyderabad',
  'IIIT Delhi',
  'IIIT Bangalore',
  'IIIT Allahabad',
  'BIT Mesra',
  'VIT Vellore',
  'SRM Institute of Science and Technology',
  'Manipal Institute of Technology',
  'Thapar Institute of Engineering and Technology',
  'LNMIIT Jaipur',
];

const NEET_INSTITUTIONS = [
  'AIIMS Delhi',
  'AIIMS Jodhpur',
  'AIIMS Bhubaneswar',
  'AIIMS Bhopal',
  'AIIMS Patna',
  'AIIMS Raipur',
  'AIIMS Rishikesh',
  'AIIMS Nagpur',
  'AIIMS Bathinda',
  "KGMU Lucknow (King George's Medical University)",
  'MAMC Delhi (Maulana Azad Medical College)',
  'VMMC Delhi (Vardhman Mahavir Medical College)',
  'LHMC Delhi (Lady Hardinge Medical College)',
  'UCMS Delhi',
  'JIPMER Puducherry',
  'CMC Vellore (Christian Medical College)',
  'AFMC Pune (Armed Forces Medical College)',
  'Grant Medical College Mumbai',
  'Seth GS Medical College Mumbai',
  'BHU Medical (IMS-BHU Varanasi)',
  'AMU Medical (JN Medical College Aligarh)',
  'Madras Medical College Chennai',
  'Stanley Medical College Chennai',
  'B.J. Medical College Ahmedabad',
  'Kasturba Medical College Manipal',
  "St. John's Medical College Bangalore",
  'MS Ramaiah Medical College Bangalore',
  'BJ Medical College Pune',
  'Govt. Medical College Nagpur',
  'Govt. Medical College Kozhikode',
  'R.G. Kar Medical College Kolkata',
  'NRS Medical College Kolkata',
  'Medical College Kolkata',
];

const CUET_INSTITUTIONS = [
  'Delhi University (North Campus)',
  'Delhi University (South Campus)',
  'JNU Delhi (Jawaharlal Nehru University)',
  'BHU Varanasi (Banaras Hindu University)',
  'AMU Aligarh (Aligarh Muslim University)',
  'Jamia Millia Islamia Delhi',
  'University of Hyderabad',
  'Allahabad University',
  'BBAU Lucknow (Babasaheb Bhimrao Ambedkar University)',
  'University of Calcutta',
  'Presidency University Kolkata',
  'Jadavpur University Kolkata',
  'University of Mumbai',
  "St. Xavier's College Mumbai",
  'University of Madras',
  'Loyola College Chennai',
  'Christ University Bangalore',
  'Mount Carmel College Bangalore',
  "St. Stephen's College Delhi",
  'Hindu College Delhi',
  'Miranda House Delhi',
  'Lady Shri Ram College Delhi (LSR)',
  'Shri Ram College of Commerce Delhi (SRCC)',
  'Hansraj College Delhi',
  'Ramjas College Delhi',
  'Fergusson College Pune',
  'Sophia College Mumbai',
  'Madras Christian College Chennai',
];

const SSC_INSTITUTIONS = [
  'Delhi University',
  'Mumbai University',
  'Savitribai Phule Pune University',
  'University of Calcutta',
  'University of Madras',
  'Bangalore University',
  'Osmania University Hyderabad',
  'Panjab University Chandigarh',
  'University of Rajasthan Jaipur',
  'Gujarat University Ahmedabad',
  'University of Lucknow',
  'Patna University',
  'University of Kerala',
  'University of Mysore',
  'Annamalai University',
  'Aligarh Muslim University',
  'Banaras Hindu University',
  'Jamia Millia Islamia Delhi',
  'Christ University Bangalore',
  'Loyola College Chennai',
  "St. Xavier's College Mumbai",
  "St. Xavier's College Kolkata",
  'Presidency College Chennai',
  'Fergusson College Pune',
  'Ravenshaw University Cuttack',
  'University of North Bengal',
  'Gauhati University',
  'Devi Ahilya Vishwavidyalaya Indore',
  'Dr. B.R. Ambedkar University Delhi',
  'IGNOU Delhi',
];

const ENGINEERING_FIELDS = [
  'Computer Science & Engineering',
  'Mechanical Engineering',
  'Electrical Engineering',
  'Electronics & Communication Engineering',
  'Civil Engineering',
  'Chemical Engineering',
  'Information Technology',
  'Aerospace Engineering',
  'Biotechnology',
  'Metallurgical Engineering',
  'Mining Engineering',
  'Textile Engineering',
  'Production & Industrial Engineering',
  'Instrumentation Engineering',
  'Data Science & Engineering',
  'AI & Machine Learning',
  'Robotics & Automation',
  'Automobile Engineering',
  'Environmental Engineering',
  'Petroleum Engineering',
];

const MEDICAL_FIELDS = [
  'General Medicine',
  'General Surgery',
  'Pediatrics',
  'Orthopedics',
  'Obstetrics & Gynecology',
  'Ophthalmology',
  'ENT (Otorhinolaryngology)',
  'Radiology',
  'Anesthesiology',
  'Dermatology',
  'Psychiatry',
  'Pathology',
  'Community Medicine',
  'Forensic Medicine',
  'Microbiology',
  'Pharmacology',
  'Anatomy',
  'Physiology',
  'Biochemistry',
  'Emergency Medicine',
  'Cardiology',
  'Neurology',
  'Nephrology',
  'Gastroenterology',
  'Pulmonology',
  'Endocrinology',
  'Oncology',
  'Urology',
  'Plastic Surgery',
  'Neurosurgery',
];

const DENTAL_FIELDS = [
  'General Dentistry',
  'Orthodontics',
  'Prosthodontics',
  'Periodontics',
  'Endodontics',
  'Oral & Maxillofacial Surgery',
  'Pediatric Dentistry',
  'Oral Pathology',
  'Public Health Dentistry',
  'Oral Medicine & Radiology',
];

const SCIENCE_FIELDS = [
  'Physics',
  'Chemistry',
  'Mathematics',
  'Botany',
  'Zoology',
  'Biotechnology',
  'Microbiology',
  'Environmental Science',
  'Geology',
  'Statistics',
  'Computer Science',
  'Electronics',
  'Biochemistry',
  'Genetics',
  'Food Science & Nutrition',
];

const COMMERCE_FIELDS = [
  'Commerce',
  'Finance',
  'Accounting',
  'Marketing',
  'Human Resources',
  'Economics',
  'Business Analytics',
  'Banking & Insurance',
  'International Business',
  'Taxation',
  'Supply Chain Management',
  'Financial Markets',
];

const ARTS_FIELDS = [
  'English',
  'History',
  'Political Science',
  'Sociology',
  'Psychology',
  'Geography',
  'Philosophy',
  'Economics',
  'Journalism & Mass Communication',
  'Fine Arts',
  'Public Administration',
  'Sanskrit',
  'Hindi',
  'Linguistics',
  'Anthropology',
];

const MBA_FIELDS = [
  'Finance',
  'Marketing',
  'Human Resources',
  'Operations Management',
  'Business Analytics',
  'International Business',
  'Information Technology',
  'Supply Chain Management',
  'Healthcare Management',
  'Entrepreneurship',
  'Rural Management',
  'Banking & Finance',
];

const PHARMA_FIELDS = [
  'Pharmaceutics',
  'Pharmacology',
  'Pharmaceutical Chemistry',
  'Pharmacognosy',
  'Pharmacy Practice',
  'Quality Assurance',
  'Regulatory Affairs',
  'Clinical Research',
];

const LAW_FIELDS = [
  'Constitutional Law',
  'Criminal Law',
  'Corporate Law',
  'International Law',
  'Intellectual Property Law',
  'Taxation Law',
  'Environmental Law',
  'Human Rights Law',
  'Family Law',
  'Cyber Law',
];

const SCHOOL_FIELDS = [
  'Science (PCM)',
  'Science (PCB)',
  'Science (PCMB)',
  'Commerce',
  'Commerce with Mathematics',
  'Arts / Humanities',
  'Vocational',
];

const DEFAULT_FIELDS = [
  'Computer Science',
  'Commerce',
  'Biology',
  'Mathematics',
  'Economics',
  'Business Administration',
  'Arts & Humanities',
];

/**
 * The source declares 22 degrees — note this is the ENGINE's list, which is
 * what `add_education_page` shows. `onboarding/pages/add_education_page.dart`
 * has its own separate 23-entry list with an extra "Other" at the end, and the
 * two are NOT the same list. See the note on `DEGREES_WITH_OTHER` below.
 */
export const DEGREES = [
  '10th / SSC',
  '12th / HSC',
  'Diploma',
  'B.Tech',
  'B.E.',
  'B.Sc',
  'B.Com',
  'BBA',
  'BA',
  'MBBS',
  'BDS',
  'B.Pharma',
  'LLB',
  'M.Tech',
  'M.Sc',
  'M.Com',
  'MBA',
  'MA',
  'MD',
  'CA',
  'CS',
  'PhD',
];

/**
 * `AutosuggestionEngine.degrees` + `'Other'` — the list the ONBOARDING
 * add-education page builds inline. Kept beside `DEGREES` because the two
 * differ by exactly one entry, and having them adjacent is the only thing
 * stopping someone "fixing" the discrepancy by merging them.
 */
export const DEGREES_WITH_OTHER = [...DEGREES, 'Other'];

/** Tag-filtered institution pool. Empty `tags` means all four pools. */
function gatherInstitutions(tags: string[]): Set<string> {
  if (tags.length === 0) {
    return new Set([
      ...JEE_INSTITUTIONS,
      ...NEET_INSTITUTIONS,
      ...CUET_INSTITUTIONS,
      ...SSC_INSTITUTIONS,
    ]);
  }
  const result = new Set<string>();
  for (const tag of tags) {
    switch (tag.toLowerCase()) {
      case 'jee':
        JEE_INSTITUTIONS.forEach((i) => result.add(i));
        break;
      case 'neet':
        NEET_INSTITUTIONS.forEach((i) => result.add(i));
        break;
      case 'cuet':
        CUET_INSTITUTIONS.forEach((i) => result.add(i));
        break;
      case 'ssc':
        SSC_INSTITUTIONS.forEach((i) => result.add(i));
        break;
    }
  }
  return result;
}

function fieldsForDegree(degree: string | null): string[] {
  if (degree === null) return DEFAULT_FIELDS;
  switch (degree.trim()) {
    case '10th / SSC':
      // Deliberately empty — a 10th-standard student has no field of study.
      return [];
    case '12th / HSC':
      return SCHOOL_FIELDS;
    case 'B.Tech':
    case 'B.E.':
    case 'Diploma':
      return ENGINEERING_FIELDS;
    case 'MBBS':
    case 'MD':
      return MEDICAL_FIELDS;
    case 'BDS':
      return DENTAL_FIELDS;
    case 'B.Sc':
      return SCIENCE_FIELDS;
    case 'B.Com':
    case 'BBA':
      return COMMERCE_FIELDS;
    case 'BA':
    case 'MA':
      return ARTS_FIELDS;
    case 'MBA':
      return MBA_FIELDS;
    case 'B.Pharma':
      return PHARMA_FIELDS;
    case 'LLB':
      return LAW_FIELDS;
    case 'M.Tech':
      return ENGINEERING_FIELDS;
    case 'M.Sc':
      return SCIENCE_FIELDS;
    case 'M.Com':
      return COMMERCE_FIELDS;
    case 'CA':
    case 'CS':
      return COMMERCE_FIELDS;
    case 'PhD':
      return DEFAULT_FIELDS;
    default:
      return DEFAULT_FIELDS;
  }
}

/** Sorts in BOTH branches — see note 2 in the header. */
function filterSuggestions(source: Iterable<string>, query: string): string[] {
  if (query.length === 0) return [...source].sort();
  const lower = query.toLowerCase();
  return [...source].filter((s) => s.toLowerCase().includes(lower)).sort();
}

export function suggestInstitutions(query = '', tags: string[] = []): string[] {
  return filterSuggestions(gatherInstitutions(tags), query);
}

export function suggestFieldsOfStudy(query = '', degree: string | null = null): string[] {
  return filterSuggestions(fieldsForDegree(degree), query);
}
