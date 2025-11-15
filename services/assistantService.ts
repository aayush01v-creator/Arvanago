export const askAI = async (lectureTitle: string, lectureSummary: string, question: string): Promise<string> => {
  const trimmedQuestion = question.trim();

  if (!trimmedQuestion) {
    return "I'm here to help once you share a question about the lecture.";
  }

  const summaryHint = lectureSummary
    ? `Here's a quick reminder from the lecture summary: ${lectureSummary}`
    : "Take another look at the core definitions and examples shared during the lecture.";

  return [
    `I don't have live AI access right now, but let's think through "${lectureTitle}" together.`,
    summaryHint,
    `When tackling "${trimmedQuestion}", break the problem into smaller steps and relate it back to the main ideas from the session.`
  ].join("\n\n");
};

export const getCourseRecommendation = async (query: string, categories: string[]): Promise<string> => {
  if (!categories.length) {
    return 'All';
  }

  const normalizedQuery = query.toLowerCase();
  const normalizedCategories = categories.map(category => ({
    original: category,
    normalized: category.toLowerCase()
  }));

  const directMatch = normalizedCategories.find(({ normalized }) => normalizedQuery.includes(normalized));
  if (directMatch) {
    return directMatch.original;
  }

  const keywordHints: Record<string, string[]> = {
    neet: ['neet', 'medical', 'doctor', 'biology'],
    jee: ['jee', 'engineering', 'iit', 'physics', 'chemistry', 'mathematics'],
    upsc: ['upsc', 'civil services', 'ias', 'ips', 'government exam'],
    'school preparation': ['school', 'class', 'grade', 'board exam', 'cbse', 'icse'],
    'skill development': ['skill', 'coding', 'programming', 'design', 'career', 'professional']
  };

  for (const { original, normalized } of normalizedCategories) {
    const hints = keywordHints[normalized as keyof typeof keywordHints];
    if (hints && hints.some(keyword => normalizedQuery.includes(keyword))) {
      return original;
    }
  }

  return categories.includes('All') ? 'All' : categories[0];
};
