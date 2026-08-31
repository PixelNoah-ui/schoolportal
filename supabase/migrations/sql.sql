{
    "grades": [
        {
            "type": "uuid",
            "column": "id",
            "default": "gen_random_uuid()",
            "nullable": "NO"
        },
        {
            "type": "uuid",
            "column": "student_id",
            "default": null,
            "nullable": "NO"
        },
        {
            "type": "uuid",
            "column": "class_subject_id",
            "default": null,
            "nullable": "NO"
        },
        {
            "type": "uuid",
            "column": "semester_id",
            "default": null,
            "nullable": "NO"
        },
        {
            "type": "numeric",
            "column": "score",
            "default": null,
            "nullable": "NO"
        },
        {
            "type": "timestamp with time zone",
            "column": "created_at",
            "default": "now()",
            "nullable": "NO"
        },
        {
            "type": "timestamp with time zone",
            "column": "updated_at",
            "default": "now()",
            "nullable": "NO"
        },
        {
            "type": "text",
            "column": "status",
            "default": "'approved'::text",
            "nullable": "NO"
        },
        {
            "type": "integer",
            "column": "attempt_number",
            "default": "1",
            "nullable": "NO"
        },
        {
            "type": "boolean",
            "column": "is_makeup",
            "default": "false",
            "nullable": "NO"
        },
        {
            "type": "boolean",
            "column": "is_excused",
            "default": "false",
            "nullable": "NO"
        },
        {
            "type": "boolean",
            "column": "is_cheating_flagged",
            "default": "false",
            "nullable": "NO"
        },
        {
            "type": "text",
            "column": "reason_code",
            "default": null,
            "nullable": "YES"
        },
        {
            "type": "uuid",
            "column": "reviewer_id",
            "default": null,
            "nullable": "YES"
        },
        {
            "type": "timestamp with time zone",
            "column": "reviewed_at",
            "default": null,
            "nullable": "YES"
        },
        {
            "type": "text",
            "column": "note",
            "default": null,
            "nullable": "YES"
        },
        {
            "type": "text",
            "column": "source",
            "default": "'teacher'::text",
            "nullable": "NO"
        },
        {
            "type": "boolean",
            "column": "is_final",
            "default": "false",
            "nullable": "NO"
        },
        {
            "type": "timestamp with time zone",
            "column": "finalized_at",
            "default": null,
            "nullable": "YES"
        }
    ],
    "classes": [
        {
            "type": "uuid",
            "column": "id",
            "default": "gen_random_uuid()",
            "nullable": "NO"
        },
        {
            "type": "text",
            "column": "name",
            "default": null,
            "nullable": "NO"
        },
        {
            "type": "integer",
            "column": "grade",
            "default": null,
            "nullable": "NO"
        },
        {
            "type": "text",
            "column": "section",
            "default": null,
            "nullable": "YES"
        },
        {
            "type": "timestamp with time zone",
            "column": "created_at",
            "default": "now()",
            "nullable": "NO"
        },
        {
            "type": "uuid",
            "column": "academic_year_id",
            "default": null,
            "nullable": "YES"
        }
    ],
    "payments": [
        {
            "type": "uuid",
            "column": "id",
            "default": "gen_random_uuid()",
            "nullable": "NO"
        },
        {
            "type": "uuid",
            "column": "student_id",
            "default": null,
            "nullable": "NO"
        },
        {
            "type": "numeric",
            "column": "amount",
            "default": null,
            "nullable": "NO"
        },
        {
            "type": "date",
            "column": "payment_month",
            "default": null,
            "nullable": "NO"
        },
        {
            "type": "text",
            "column": "status",
            "default": "'pending'::text",
            "nullable": "NO"
        },
        {
            "type": "text",
            "column": "payment_method",
            "default": null,
            "nullable": "YES"
        },
        {
            "type": "text",
            "column": "proof_path",
            "default": null,
            "nullable": "YES"
        },
        {
            "type": "timestamp with time zone",
            "column": "submitted_at",
            "default": null,
            "nullable": "YES"
        },
        {
            "type": "timestamp with time zone",
            "column": "reviewed_at",
            "default": null,
            "nullable": "YES"
        },
        {
            "type": "uuid",
            "column": "reviewed_by",
            "default": null,
            "nullable": "YES"
        },
        {
            "type": "text",
            "column": "rejection_reason",
            "default": null,
            "nullable": "YES"
        },
        {
            "type": "text",
            "column": "note",
            "default": null,
            "nullable": "YES"
        },
        {
            "type": "timestamp with time zone",
            "column": "created_at",
            "default": "now()",
            "nullable": "NO"
        },
        {
            "type": "timestamp with time zone",
            "column": "updated_at",
            "default": "now()",
            "nullable": "NO"
        },
        {
            "type": "uuid",
            "column": "academic_year_id",
            "default": null,
            "nullable": "YES"
        },
        {
            "type": "numeric",
            "column": "amount_due",
            "default": null,
            "nullable": "YES"
        },
        {
            "type": "numeric",
            "column": "approved_amount",
            "default": null,
            "nullable": "YES"
        }
    ],
    "profiles": [
        {
            "type": "uuid",
            "column": "id",
            "default": null,
            "nullable": "NO"
        },
        {
            "type": "text",
            "column": "full_name",
            "default": null,
            "nullable": "NO"
        },
        {
            "type": "text",
            "column": "username",
            "default": null,
            "nullable": "NO"
        },
        {
            "type": "text",
            "column": "email",
            "default": null,
            "nullable": "NO"
        },
        {
            "type": "text",
            "column": "role",
            "default": null,
            "nullable": "NO"
        },
        {
            "type": "boolean",
            "column": "is_active",
            "default": "true",
            "nullable": "NO"
        },
        {
            "type": "timestamp with time zone",
            "column": "created_at",
            "default": "now()",
            "nullable": "NO"
        },
        {
            "type": "timestamp with time zone",
            "column": "updated_at",
            "default": "now()",
            "nullable": "NO"
        }
    ],
    "students": [
        {
            "type": "uuid",
            "column": "id",
            "default": "gen_random_uuid()",
            "nullable": "NO"
        },
        {
            "type": "uuid",
            "column": "profile_id",
            "default": null,
            "nullable": "NO"
        },
        {
            "type": "uuid",
            "column": "class_id",
            "default": null,
            "nullable": "YES"
        },
        {
            "type": "text",
            "column": "phone",
            "default": null,
            "nullable": "YES"
        },
        {
            "type": "date",
            "column": "date_of_birth",
            "default": null,
            "nullable": "YES"
        },
        {
            "type": "timestamp with time zone",
            "column": "created_at",
            "default": "now()",
            "nullable": "NO"
        },
        {
            "type": "timestamp with time zone",
            "column": "updated_at",
            "default": "now()",
            "nullable": "NO"
        },
        {
            "type": "text",
            "column": "temporary_password",
            "default": null,
            "nullable": "YES"
        }
    ],
    "subjects": [
        {
            "type": "uuid",
            "column": "id",
            "default": "gen_random_uuid()",
            "nullable": "NO"
        },
        {
            "type": "text",
            "column": "name",
            "default": null,
            "nullable": "NO"
        },
        {
            "type": "timestamp with time zone",
            "column": "created_at",
            "default": "now()",
            "nullable": "NO"
        }
    ],
    "teachers": [
        {
            "type": "uuid",
            "column": "id",
            "default": "gen_random_uuid()",
            "nullable": "NO"
        },
        {
            "type": "uuid",
            "column": "profile_id",
            "default": null,
            "nullable": "NO"
        },
        {
            "type": "text",
            "column": "phone",
            "default": null,
            "nullable": "YES"
        },
        {
            "type": "timestamp with time zone",
            "column": "created_at",
            "default": "now()",
            "nullable": "NO"
        },
        {
            "type": "timestamp with time zone",
            "column": "updated_at",
            "default": "now()",
            "nullable": "NO"
        },
        {
            "type": "text",
            "column": "temporary_password",
            "default": null,
            "nullable": "YES"
        }
    ],
    "schedules": [
        {
            "type": "uuid",
            "column": "id",
            "default": "gen_random_uuid()",
            "nullable": "NO"
        },
        {
            "type": "uuid",
            "column": "class_subject_id",
            "default": null,
            "nullable": "NO"
        },
        {
            "type": "smallint",
            "column": "day_of_week",
            "default": null,
            "nullable": "NO"
        },
        {
            "type": "time without time zone",
            "column": "start_time",
            "default": null,
            "nullable": "NO"
        },
        {
            "type": "time without time zone",
            "column": "end_time",
            "default": null,
            "nullable": "NO"
        },
        {
            "type": "text",
            "column": "room",
            "default": null,
            "nullable": "YES"
        },
        {
            "type": "timestamp with time zone",
            "column": "created_at",
            "default": "now()",
            "nullable": "NO"
        },
        {
            "type": "timestamp with time zone",
            "column": "updated_at",
            "default": "now()",
            "nullable": "NO"
        }
    ],
    "semesters": [
        {
            "type": "uuid",
            "column": "id",
            "default": "gen_random_uuid()",
            "nullable": "NO"
        },
        {
            "type": "uuid",
            "column": "academic_year_id",
            "default": null,
            "nullable": "NO"
        },
        {
            "type": "text",
            "column": "name",
            "default": null,
            "nullable": "NO"
        },
        {
            "type": "date",
            "column": "start_date",
            "default": null,
            "nullable": "YES"
        },
        {
            "type": "date",
            "column": "end_date",
            "default": null,
            "nullable": "YES"
        },
        {
            "type": "timestamp with time zone",
            "column": "created_at",
            "default": "now()",
            "nullable": "NO"
        },
        {
            "type": "text",
            "column": "status",
            "default": "'grading_open'::text",
            "nullable": "NO"
        },
        {
            "type": "text",
            "column": "period_type",
            "default": "'semester'::text",
            "nullable": "NO"
        }
    ],
    "academic_years": [
        {
            "type": "uuid",
            "column": "id",
            "default": "gen_random_uuid()",
            "nullable": "NO"
        },
        {
            "type": "text",
            "column": "name",
            "default": null,
            "nullable": "NO"
        },
        {
            "type": "date",
            "column": "start_date",
            "default": null,
            "nullable": "YES"
        },
        {
            "type": "date",
            "column": "end_date",
            "default": null,
            "nullable": "YES"
        },
        {
            "type": "boolean",
            "column": "is_current",
            "default": "false",
            "nullable": "NO"
        },
        {
            "type": "timestamp with time zone",
            "column": "created_at",
            "default": "now()",
            "nullable": "NO"
        },
        {
            "type": "text",
            "column": "status",
            "default": "'draft'::text",
            "nullable": "NO"
        }
    ],
    "class_subjects": [
        {
            "type": "uuid",
            "column": "id",
            "default": "gen_random_uuid()",
            "nullable": "NO"
        },
        {
            "type": "uuid",
            "column": "class_id",
            "default": null,
            "nullable": "NO"
        },
        {
            "type": "uuid",
            "column": "subject_id",
            "default": null,
            "nullable": "NO"
        },
        {
            "type": "uuid",
            "column": "teacher_id",
            "default": null,
            "nullable": "YES"
        },
        {
            "type": "timestamp with time zone",
            "column": "created_at",
            "default": "now()",
            "nullable": "NO"
        },
        {
            "type": "uuid",
            "column": "academic_year_id",
            "default": null,
            "nullable": "YES"
        }
    ],
    "assessment_types": [
        {
            "type": "uuid",
            "column": "id",
            "default": "gen_random_uuid()",
            "nullable": "NO"
        },
        {
            "type": "text",
            "column": "name",
            "default": null,
            "nullable": "NO"
        },
        {
            "type": "timestamp with time zone",
            "column": "created_at",
            "default": "now()",
            "nullable": "NO"
        }
    ],
    "ranking_policies": [
        {
            "type": "uuid",
            "column": "id",
            "default": "gen_random_uuid()",
            "nullable": "NO"
        },
        {
            "type": "uuid",
            "column": "semester_id",
            "default": null,
            "nullable": "NO"
        },
        {
            "type": "boolean",
            "column": "require_all_subjects_complete",
            "default": "true",
            "nullable": "NO"
        },
        {
            "type": "boolean",
            "column": "allow_makeup_exam",
            "default": "true",
            "nullable": "NO"
        },
        {
            "type": "boolean",
            "column": "use_latest_valid_score",
            "default": "true",
            "nullable": "NO"
        },
        {
            "type": "boolean",
            "column": "use_best_valid_score",
            "default": "false",
            "nullable": "NO"
        },
        {
            "type": "boolean",
            "column": "zero_for_unexcused_absence",
            "default": "false",
            "nullable": "NO"
        },
        {
            "type": "boolean",
            "column": "exclude_disciplinary",
            "default": "true",
            "nullable": "NO"
        },
        {
            "type": "boolean",
            "column": "exclude_withdrawn",
            "default": "true",
            "nullable": "NO"
        },
        {
            "type": "boolean",
            "column": "exclude_suspended",
            "default": "true",
            "nullable": "NO"
        },
        {
            "type": "integer",
            "column": "version",
            "default": "1",
            "nullable": "NO"
        },
        {
            "type": "timestamp with time zone",
            "column": "created_at",
            "default": "now()",
            "nullable": "NO"
        },
        {
            "type": "boolean",
            "column": "exclude_incomplete",
            "default": "true",
            "nullable": "NO"
        },
        {
            "type": "boolean",
            "column": "exclude_excused",
            "default": "false",
            "nullable": "NO"
        }
    ],
    "ranking_snapshots": [
        {
            "type": "uuid",
            "column": "id",
            "default": "gen_random_uuid()",
            "nullable": "NO"
        },
        {
            "type": "uuid",
            "column": "class_id",
            "default": null,
            "nullable": "NO"
        },
        {
            "type": "uuid",
            "column": "semester_id",
            "default": null,
            "nullable": "NO"
        },
        {
            "type": "integer",
            "column": "policy_version",
            "default": "1",
            "nullable": "NO"
        },
        {
            "type": "timestamp with time zone",
            "column": "generated_at",
            "default": "now()",
            "nullable": "NO"
        },
        {
            "type": "boolean",
            "column": "is_final",
            "default": "true",
            "nullable": "NO"
        },
        {
            "type": "jsonb",
            "column": "snapshot_json",
            "default": null,
            "nullable": "NO"
        },
        {
            "type": "timestamp with time zone",
            "column": "created_at",
            "default": "now()",
            "nullable": "NO"
        },
        {
            "type": "uuid",
            "column": "academic_year_id",
            "default": null,
            "nullable": "YES"
        }
    ],
    "academic_standings": [
        {
            "type": "uuid",
            "column": "id",
            "default": "gen_random_uuid()",
            "nullable": "NO"
        },
        {
            "type": "uuid",
            "column": "student_id",
            "default": null,
            "nullable": "NO"
        },
        {
            "type": "uuid",
            "column": "semester_id",
            "default": null,
            "nullable": "NO"
        },
        {
            "type": "text",
            "column": "standing_type",
            "default": null,
            "nullable": "NO"
        },
        {
            "type": "text",
            "column": "reason",
            "default": null,
            "nullable": "YES"
        },
        {
            "type": "boolean",
            "column": "is_active",
            "default": "true",
            "nullable": "NO"
        },
        {
            "type": "timestamp with time zone",
            "column": "created_at",
            "default": "now()",
            "nullable": "NO"
        }
    ],
    "assessment_results": [
        {
            "type": "uuid",
            "column": "id",
            "default": "gen_random_uuid()",
            "nullable": "NO"
        },
        {
            "type": "uuid",
            "column": "student_id",
            "default": null,
            "nullable": "NO"
        },
        {
            "type": "uuid",
            "column": "course_assessment_id",
            "default": null,
            "nullable": "NO"
        },
        {
            "type": "numeric",
            "column": "score",
            "default": null,
            "nullable": "YES"
        },
        {
            "type": "text",
            "column": "status",
            "default": "'normal'::text",
            "nullable": "NO"
        },
        {
            "type": "integer",
            "column": "attempt_number",
            "default": "1",
            "nullable": "NO"
        },
        {
            "type": "boolean",
            "column": "is_makeup",
            "default": "false",
            "nullable": "NO"
        },
        {
            "type": "text",
            "column": "reason_code",
            "default": null,
            "nullable": "YES"
        },
        {
            "type": "uuid",
            "column": "reviewer_id",
            "default": null,
            "nullable": "YES"
        },
        {
            "type": "timestamp with time zone",
            "column": "reviewed_at",
            "default": null,
            "nullable": "YES"
        },
        {
            "type": "text",
            "column": "note",
            "default": null,
            "nullable": "YES"
        },
        {
            "type": "text",
            "column": "source",
            "default": "'teacher'::text",
            "nullable": "NO"
        },
        {
            "type": "boolean",
            "column": "is_final",
            "default": "false",
            "nullable": "NO"
        },
        {
            "type": "timestamp with time zone",
            "column": "finalized_at",
            "default": null,
            "nullable": "YES"
        },
        {
            "type": "timestamp with time zone",
            "column": "created_at",
            "default": "now()",
            "nullable": "NO"
        },
        {
            "type": "timestamp with time zone",
            "column": "updated_at",
            "default": "now()",
            "nullable": "NO"
        }
    ],
    "course_assessments": [
        {
            "type": "uuid",
            "column": "id",
            "default": "gen_random_uuid()",
            "nullable": "NO"
        },
        {
            "type": "uuid",
            "column": "class_subject_id",
            "default": null,
            "nullable": "NO"
        },
        {
            "type": "uuid",
            "column": "semester_id",
            "default": null,
            "nullable": "NO"
        },
        {
            "type": "uuid",
            "column": "assessment_type_id",
            "default": null,
            "nullable": "NO"
        },
        {
            "type": "text",
            "column": "name",
            "default": null,
            "nullable": "NO"
        },
        {
            "type": "numeric",
            "column": "weight",
            "default": null,
            "nullable": "NO"
        },
        {
            "type": "numeric",
            "column": "max_score",
            "default": null,
            "nullable": "NO"
        },
        {
            "type": "integer",
            "column": "order_number",
            "default": "1",
            "nullable": "NO"
        },
        {
            "type": "timestamp with time zone",
            "column": "created_at",
            "default": "now()",
            "nullable": "NO"
        }
    ],
    "grade_review_cases": [
        {
            "type": "uuid",
            "column": "id",
            "default": "gen_random_uuid()",
            "nullable": "NO"
        },
        {
            "type": "uuid",
            "column": "student_id",
            "default": null,
            "nullable": "NO"
        },
        {
            "type": "uuid",
            "column": "grade_id",
            "default": null,
            "nullable": "NO"
        },
        {
            "type": "text",
            "column": "case_type",
            "default": null,
            "nullable": "NO"
        },
        {
            "type": "text",
            "column": "status",
            "default": "'open'::text",
            "nullable": "NO"
        },
        {
            "type": "text",
            "column": "reason",
            "default": null,
            "nullable": "NO"
        },
        {
            "type": "uuid",
            "column": "reviewer_id",
            "default": null,
            "nullable": "YES"
        },
        {
            "type": "text",
            "column": "decision",
            "default": null,
            "nullable": "YES"
        },
        {
            "type": "numeric",
            "column": "override_score",
            "default": null,
            "nullable": "YES"
        },
        {
            "type": "timestamp with time zone",
            "column": "created_at",
            "default": "now()",
            "nullable": "NO"
        }
    ],
    "student_enrollments": [
        {
            "type": "uuid",
            "column": "id",
            "default": "gen_random_uuid()",
            "nullable": "NO"
        },
        {
            "type": "uuid",
            "column": "student_id",
            "default": null,
            "nullable": "NO"
        },
        {
            "type": "uuid",
            "column": "class_id",
            "default": null,
            "nullable": "NO"
        },
        {
            "type": "uuid",
            "column": "academic_year_id",
            "default": null,
            "nullable": "NO"
        },
        {
            "type": "timestamp with time zone",
            "column": "enrolled_at",
            "default": "now()",
            "nullable": "NO"
        },
        {
            "type": "timestamp with time zone",
            "column": "left_at",
            "default": null,
            "nullable": "YES"
        },
        {
            "type": "text",
            "column": "status",
            "default": "'active'::text",
            "nullable": "NO"
        },
        {
            "type": "timestamp with time zone",
            "column": "created_at",
            "default": "now()",
            "nullable": "NO"
        }
    ],
    "course_grade_submissions": [
        {
            "type": "uuid",
            "column": "id",
            "default": "gen_random_uuid()",
            "nullable": "NO"
        },
        {
            "type": "uuid",
            "column": "class_subject_id",
            "default": null,
            "nullable": "NO"
        },
        {
            "type": "uuid",
            "column": "semester_id",
            "default": null,
            "nullable": "NO"
        },
        {
            "type": "text",
            "column": "status",
            "default": "'draft'::text",
            "nullable": "NO"
        },
        {
            "type": "uuid",
            "column": "submitted_by",
            "default": null,
            "nullable": "YES"
        },
        {
            "type": "timestamp with time zone",
            "column": "submitted_at",
            "default": null,
            "nullable": "YES"
        },
        {
            "type": "timestamp with time zone",
            "column": "locked_at",
            "default": null,
            "nullable": "YES"
        },
        {
            "type": "timestamp with time zone",
            "column": "created_at",
            "default": "now()",
            "nullable": "NO"
        },
        {
            "type": "timestamp with time zone",
            "column": "updated_at",
            "default": "now()",
            "nullable": "NO"
        }
    ],
    "payment_month_allocations": [
        {
            "type": "uuid",
            "column": "id",
            "default": "gen_random_uuid()",
            "nullable": "NO"
        },
        {
            "type": "uuid",
            "column": "payment_id",
            "default": null,
            "nullable": "NO"
        },
        {
            "type": "date",
            "column": "payment_month",
            "default": null,
            "nullable": "NO"
        },
        {
            "type": "numeric",
            "column": "amount",
            "default": null,
            "nullable": "NO"
        },
        {
            "type": "timestamp with time zone",
            "column": "created_at",
            "default": "now()",
            "nullable": "NO"
        }
    ]
}