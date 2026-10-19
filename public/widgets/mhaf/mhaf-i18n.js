/**
 * MHAF Accessibility Widget - Internationalization
 * Supports Arabic (RTL), French (LTR), and English (LTR)
 */

export const LANGUAGES = {
  ar: { name: 'العربية', dir: 'rtl' },
  fr: { name: 'Français', dir: 'ltr' },
  en: { name: 'English', dir: 'ltr' }
};

export const DICTIONARY = {
  ar: {
    widgetTitle: 'خيارات إمكانية الوصول',
    widgetSubtitle: 'تخصيص تجربة التصفح لتناسب احتياجاتك',
    reset: 'إعادة ضبط الإعدادات',
    close: 'إغلاق',
    statement: 'بيان إمكانية الوصول',
    profilesTitle: 'الملفات الشخصية المناسبة',
    toolsTitle: 'أدوات التخصيص',
    readabilityTitle: 'وضوح وقراءة النصوص',
    contrastTitle: 'الألوان والتباين',
    assistiveTitle: 'الأدوات المساعدة والتنقل',
    active: 'مفعل',
    inactive: 'معطل',
    poweredBy: 'مدعوم من MHAF',

    // Profiles
    motor_impaired: 'الإعاقة الحركية',
    motor_impaired_desc: 'تكبير الأزرار وتسهيل التنقل عبر لوحة المفاتيح',
    dyslexic_profile: 'صعوبة القراءة (الديسلكسيا)',
    dyslexic_profile_desc: 'خط مخصص للقراءة السلسة وإيقاف الحركات المشتتة',
    cognitive_learning: 'التعلم والإدراك',
    cognitive_learning_desc: 'مسطرة قراءة وتكبير العناوين لفهم أسرع',
    epilepsy_safe: 'آمن لمرضى الصرع',
    epilepsy_safe_desc: 'إيقاف كل الحركات السريعة والوميض وتخفيف الألوان',
    visually_impaired: 'ضعاف البصر',
    visually_impaired_desc: 'زيادة التباين وحجم الخط ووضوح الروابط',
    color_blind: 'عمى الألوان',
    color_blind_desc: 'تعديل تشبع الألوان للتمييز بين العناصر',
    adhd_profile: 'التركيز وتشتت الانتباه (ADHD)',
    adhd_profile_desc: 'قناع حجب التشتت لمتابعة سطر بسطر',

    // Features
    scale_content: 'تكبير المحتوى',
    readable_font: 'خط سهل القراءة',
    dyslexic_font: 'خط عسر القراءة',
    font_size: 'حجم النص',
    letter_spacing: 'تباعد الحروف',
    line_height: 'ارتفاع الأسطر',
    text_align: 'محاذاة النص',
    align_left: 'يسار',
    align_center: 'وسط',
    align_right: 'يمين',
    outline_titles: 'تمييز العناوين',
    outline_links: 'تمييز الروابط',

    dark_contrast: 'تباين داكن',
    light_contrast: 'تباين فاتح',
    color_balance: 'توازن الألوان',
    contrast_high: 'تباين عالٍ',
    saturation_high: 'تشبع عالٍ',
    monochrome: 'أبيض وأسود',
    invert_colors: 'عكس الألوان',

    reading_guide: 'مسطرة القراءة',
    reading_mask: 'قناع القراءة المركز',
    text_magnifier: 'عدسة تكبير النص',
    image_caption: 'قراءة وصف الصور',
    mute_sound: 'كتم الأصوات والفيديو',
    disable_animation: 'إيقاف الحركات والوميض',
    cursor_size: 'مؤشر فارة كبير',
    focus_outline: 'إطار التركيز النشط',
    keyboard_navigation: 'التنقل بلوحة المفاتيح'
  },
  fr: {
    widgetTitle: "Options d'Accessibilité",
    widgetSubtitle: "Adaptez l'affichage du site à vos besoins",
    reset: 'Réinitialiser les réglages',
    close: 'Fermer',
    statement: "Déclaration d'accessibilité",
    profilesTitle: 'Profils d’assistance recommandés',
    toolsTitle: 'Outils personnalisés',
    readabilityTitle: 'Lisibilité & Textes',
    contrastTitle: 'Couleurs & Contrastes',
    assistiveTitle: 'Assistance visuelle & Navigation',
    active: 'Activé',
    inactive: 'Désactivé',
    poweredBy: 'Propulsé par MHAF',

    // Profiles
    motor_impaired: 'Mobilité réduite',
    motor_impaired_desc: 'Agrandit les boutons et simplifie la navigation clavier',
    dyslexic_profile: 'Dyslexie',
    dyslexic_profile_desc: 'Police adaptée et arrêt des animations distrayantes',
    cognitive_learning: 'Cognitif & Apprentissage',
    cognitive_learning_desc: 'Guide de lecture et surbrillance des titres importants',
    epilepsy_safe: 'Sécurité Épilepsie',
    epilepsy_safe_desc: 'Supprime tous les flashs, clignotements et animations',
    visually_impaired: 'Malvoyance',
    visually_impaired_desc: 'Contraste renforcé, textes agrandis et liens surlignés',
    color_blind: 'Daltonisme',
    color_blind_desc: 'Ajuste la saturation pour mieux distinguer les couleurs',
    adhd_profile: 'Trouble de l’attention (TDAH)',
    adhd_profile_desc: 'Masque de concentration pour lire ligne par ligne',

    // Features
    scale_content: 'Zoom global du site',
    readable_font: 'Police lisible standard',
    dyslexic_font: 'Police OpenDyslexic',
    font_size: 'Taille du texte',
    letter_spacing: 'Espacement des lettres',
    line_height: 'Hauteur de ligne',
    text_align: 'Alignement du texte',
    align_left: 'Gauche',
    align_center: 'Centre',
    align_right: 'Droite',
    outline_titles: 'Encadrer les titres',
    outline_links: 'Encadrer les liens',

    dark_contrast: 'Contraste sombre',
    light_contrast: 'Contraste clair',
    color_balance: 'Équilibre des couleurs',
    contrast_high: 'Fort contraste',
    saturation_high: 'Forte saturation',
    monochrome: 'Noir & Blanc',
    invert_colors: 'Couleurs inversées',

    reading_guide: 'Guide de lecture (Règle)',
    reading_mask: 'Masque de lecture concentré',
    text_magnifier: 'Loupe de texte au survol',
    image_caption: 'Afficher description des images',
    mute_sound: 'Couper sons & vidéos',
    disable_animation: 'Désactiver les animations',
    cursor_size: 'Grand curseur souris',
    focus_outline: 'Indicateur de focus visible',
    keyboard_navigation: 'Mode navigation clavier'
  },
  en: {
    widgetTitle: 'Accessibility Options',
    widgetSubtitle: 'Customize your browsing experience',
    reset: 'Reset settings',
    close: 'Close',
    statement: 'Accessibility Statement',
    profilesTitle: 'Accessibility Profiles',
    toolsTitle: 'Custom Tools',
    readabilityTitle: 'Readability & Fonts',
    contrastTitle: 'Colors & Contrast',
    assistiveTitle: 'Assistive Tools & Navigation',
    active: 'Active',
    inactive: 'Inactive',
    poweredBy: 'Powered by MHAF',

    // Profiles
    motor_impaired: 'Motor Impaired',
    motor_impaired_desc: 'Enlarges clickable elements and optimizes keyboard navigation',
    dyslexic_profile: 'Dyslexia Friendly',
    dyslexic_profile_desc: 'Dedicated readable font and distraction-free layout',
    cognitive_learning: 'Cognitive & Learning',
    cognitive_learning_desc: 'Reading guide and highlighted essential headings',
    epilepsy_safe: 'Epilepsy Safe Mode',
    epilepsy_safe_desc: 'Eliminates all flashing, rapid animations and bright flashes',
    visually_impaired: 'Visually Impaired',
    visually_impaired_desc: 'Boosts contrast, text scale and outlines interactive elements',
    color_blind: 'Color Blind Mode',
    color_blind_desc: 'Adjusts saturation and spectrum contrast for better clarity',
    adhd_profile: 'ADHD Friendly',
    adhd_profile_desc: 'Focus mask that dims background and highlights the active line',

    // Features
    scale_content: 'Content Scale',
    readable_font: 'Readable Font',
    dyslexic_font: 'Dyslexic Font',
    font_size: 'Font Size',
    letter_spacing: 'Letter Spacing',
    line_height: 'Line Height',
    text_align: 'Text Alignment',
    align_left: 'Left',
    align_center: 'Center',
    align_right: 'Right',
    outline_titles: 'Outline Titles',
    outline_links: 'Outline Links',

    dark_contrast: 'Dark High Contrast',
    light_contrast: 'Light High Contrast',
    color_balance: 'Color Balance',
    contrast_high: 'High Contrast',
    saturation_high: 'High Saturation',
    monochrome: 'Monochrome',
    invert_colors: 'Invert Colors',

    reading_guide: 'Reading Guide',
    reading_mask: 'Reading Mask',
    text_magnifier: 'Text Magnifier',
    image_caption: 'Image Alt Captions',
    mute_sound: 'Mute Sounds & Videos',
    disable_animation: 'Stop Animations',
    cursor_size: 'Big Mouse Cursor',
    focus_outline: 'Focus Ring Highlight',
    keyboard_navigation: 'Keyboard Navigation'
  }
};

export function detectLanguage() {
  try {
    const saved = localStorage.getItem('mhaf:lang');
    if (saved && saved in LANGUAGES) return saved;
  } catch (e) {}

  const docLang = (document.documentElement.lang || navigator.language || 'fr')
    .split('-')[0]
    .toLowerCase();

  return docLang in LANGUAGES ? docLang : 'fr';
}
