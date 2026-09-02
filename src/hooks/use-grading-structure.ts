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
  name: string;
  maxScore: number;
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
      // Creates the default 20/30/50 structure the first time this
      // subject + semester is opened; no-ops if one already exists.
      const { data: components, error: componentsError } = await supabase.rpc(
        "ensure_default_grading_structure",
        { p_class_subject_id: classSubjectId, p_semester_id: semesterId },
      );
      if (componentsError) throw componentsError;

      const { data: submission, error: submissionError } = await supabase
        .from("course_grade_submissions")
        .select("status")
        .eq("class_subject_id", classSubjectId)
        .eq("semester_id", semesterId)
        .maybeSingle();
      if (submissionError) throw submissionError;

      return {
        isLocked: submission?.status ? submission.status !== "draft" : false,
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
      const { data, error } = await supabase.rpc("save_grading_structure", {
        p_class_subject_id: classSubjectId,
        p_semester_id: semesterId,
        p_components: components.map((c) => ({
          name: c.name,
          max_score: c.maxScore,
          order_number: c.orderNumber,
        })),
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  return { ...query, saveStructure };
}
