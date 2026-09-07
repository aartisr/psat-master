import { useMemo } from 'react';
import { Question, FilterCriteria } from '../types';
import { searchQuestions } from '../data/questions';

export function useQuestionSearch(
  questions: Question[],
  filters: Partial<FilterCriteria>
) {
  return useMemo(() => {
    return searchQuestions(questions, filters);
  }, [questions, filters]);
}
