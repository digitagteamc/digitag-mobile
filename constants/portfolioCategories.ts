// Freelancer profession categories that come with portfolio work worth
// showcasing visually — only freelancers in one of these get the
// image-upload option when composing a post, and only their posts show
// the uploaded image on post cards (not creator posts, not other
// freelancer categories).
export const IMAGE_UPLOAD_CATEGORIES = [
    'Photography',
    'Property Rental',
    'Fashion Designers',
    'Models',
    'Styling & Makeup',
];

const normalizeCategory = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');

// Substring match both ways so slight backend naming differences (e.g.
// "Fashion Designer" vs "Fashion Designers") still resolve correctly.
export const categoryMatches = (a: string, b: string) => {
    const na = normalizeCategory(a), nb = normalizeCategory(b);
    return !!na && !!nb && (na.includes(nb) || nb.includes(na));
};

export const matchesPortfolioCategory = (categories: (string | null | undefined)[]) =>
    IMAGE_UPLOAD_CATEGORIES.some((c) => categories.some((oc) => oc && categoryMatches(c, oc)));
