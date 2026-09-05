"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";

export interface GradingComponent {
  id: string;
  name: string;
  maxScore: number;
  orderNumber: number;
}

export interface DraftComponent {
  id?: string;
  name: string;
  maxScore: number | "";
  orderNumber: number;
}

export function useGradingStructure(
  classSubjectId: string,
  semesterId: string,
) {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const queryKey = ["grading-structure", classSubjectId, semesterId];

  const query = useQuery({
    queryKey,
    enabled: Boolean(classSubjectId && semesterId),
    queryFn: async () => {
      const { data: classSubject, error: classSubjectError } = await supabase
        .from("class_subjects")
        .select("class_id, subject_id, semester_id")
        .eq("id", classSubjectId)
        .single();
      if (classSubjectError) throw classSubjectError;

      const { data: semesterClassSubject, error: semesterClassSubjectError } =
        await supabase
          .from("class_subjects")
          .select("id, semester_id")
          .eq("class_id", classSubject.class_id)
          .eq("subject_id", classSubject.subject_id)
          .eq(
            "semester_id",
            semesterId.startsWith("sem-")
              ? classSubject.semester_id
              : semesterId,
          )
          .maybeSingle();
      if (semesterClassSubjectError) throw semesterClassSubjectError;
      const activeClassSubjectId = semesterClassSubject?.id ?? classSubjectId;
      const activeSemesterId =
        semesterClassSubject?.semester_id ?? classSubject.semester_id;

      const { data: components, error: componentsError } = await supabase
        .from("course_assessments")
        .select("id, name, max_score, order_number")
        .eq("class_subject_id", activeClassSubjectId)
        .eq("semester_id", activeSemesterId)
        .order("order_number");
      if (componentsError) throw componentsError;

      return {
        isLocked: false,
        components: (components ?? [])
          .sort((a: any, b: any) => a.order_number - b.order_number)
          .map((c: any) => ({
            id: c.id,
            name: c.name,
            maxScore: Number(c.max_score),
            orderNumber: c.order_number,
          })) as GradingComponent[],
      };
    },
  });

  const saveStructure = useMutation({
    mutationFn: async (components: DraftComponent[]) => {
      const { data: classSubject, error: classSubjectError } = await supabase
        .from("class_subjects")
        .select("class_id, subject_id, semester_id")
        .eq("id", classSubjectId)
        .single();
      if (classSubjectError) throw classSubjectError;

      const { data: semesterClassSubject, error: semesterClassSubjectError } =
        await supabase
          .from("class_subjects")
          .select("id, semester_id")
          .eq("class_id", classSubject.class_id)
          .eq("subject_id", classSubject.subject_id)
          .eq(
            "semester_id",
            semesterId.startsWith("sem-")
              ? classSubject.semester_id
              : semesterId,
          )
          .maybeSingle();
      if (semesterClassSubjectError) throw semesterClassSubjectError;
      const activeClassSubjectId = semesterClassSubject?.id ?? classSubjectId;
      const activeSemesterId =
        semesterClassSubject?.semester_id ?? classSubject.semester_id;

      const totalMarks = components.reduce(
        (sum, component) => sum + (Number(component.maxScore) || 0),
        0,
      );
      if (totalMarks <= 0 || totalMarks > 100) {
        throw new Error(
          "The grading structure must total between 1 and 100 marks.",
        );
      }

      const { data: existingAssessments, error: existingError } = await supabase
        .from("course_assessments")
        .select("id, name, max_score")
        .eq("class_subject_id", activeClassSubjectId)
        .eq("semester_id", activeSemesterId);
      if (existingError) throw existingError;

      const draftIds = new Set(
        components.map((component) => component.id).filter(Boolean),
      );
      const removedIds = (existingAssessments ?? [])
        .map((assessment) => assessment.id)
        .filter((id) => !draftIds.has(id));
      if (removedIds.length > 0) {
        const { count, error: resultsError } = await supabase
          .from("assessment_results")
          .select("id", { count: "exact", head: true })
          .in("course_assessment_id", removedIds);
        if (resultsError) throw resultsError;
        if ((count ?? 0) > 0) {
          throw new Error(
            "A component with saved grades cannot be deleted. Rename it or keep it in the structure.",
          );
        }
        const { error: deleteError } = await supabase
          .from("course_assessments")
          .delete()
          .in("id", removedIds);
        if (deleteError) throw deleteError;
      }

      for (const component of components) {
        if (!component.id) continue;
        const existing = existingAssessments?.find(
          (assessment) => assessment.id === component.id,
        );
        if (!existing || Number(existing.max_score) <= component.maxScore)
          continue;
        const { data: scores, error: scoresError } = await supabase
          .from("assessment_results")
          .select("score")
          .eq("course_assessment_id", component.id)
          .not("score", "is", null)
          .gt("score", component.maxScore);
        if (scoresError) throw scoresError;
        if ((scores ?? []).length > 0) {
          throw new Error(
            `${existing.name} cannot be reduced below an existing student score.`,
          );
        }
      }

      const assessments = components.map((component) => ({
        ...(component.id ? { id: component.id } : {}),
        class_subject_id: activeClassSubjectId,
        semester_id: activeSemesterId,
        name: component.name,
        max_score: Number(component.maxScore),
        order_number: component.orderNumber,
      }));
      const { error } = await supabase
        .from("course_assessments")
        .upsert(assessments, {
          onConflict: "class_subject_id,semester_id,name",
        });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  return { ...query, saveStructure };
}
