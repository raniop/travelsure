import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { HealthQuestionCard, PillYesNo } from "@/components/travelProposal/ProposalUi";
import {
  displayName,
  markAllHealthNo,
} from "@/lib/travelProposal/formDefaults";
import {
  PREGNANCY_AGE_NOTE,
  PREGNANCY_EXT_NOTE,
  PREGNANCY_SECTION_TITLE,
  Q1_NOTE,
  Q1_REJECT,
  Q1_TITLE,
  Q2_EXCEPTIONS,
  Q2_IF_NO,
  Q2_IF_YES,
  Q2_POSITIVE_DOC,
  Q2_TITLE,
  Q21_NEGATIVE_EXT,
  Q21_OPTIONS,
  Q21_TITLE,
  Q22_BODY,
  Q22_TITLE,
  Q3_IF_NO,
  Q3_IF_YES,
  Q3_NOTE,
  Q3_TITLE,
  Q3_TOPICS,
  Q31_IF_NO,
  Q31_IF_YES,
  Q31_TITLE,
  Q4_DETAILS_HINT,
  Q4_DETAILS_LABEL,
  Q4_IF_YES,
  Q4_TITLE,
  Q5_TITLE,
  Q51_TITLE,
  Q52_REJECT,
  Q52_TITLE,
} from "@/lib/travelProposal/healthQuestions";
import {
  PERSON_LABELS_HE,
  type InsuredPerson,
  type PersonHealth,
  type PersonKey,
  type TravelProposalForm,
  type YesNo,
} from "@/lib/travelProposal/types";

type GroupKey = "q1" | "q2" | "q3" | "q4" | "q5";

const personLabel = (key: PersonKey, person: InsuredPerson) =>
  displayName(person) || PERSON_LABELS_HE[key];

function WhoPicker({
  people,
  selected,
  onToggle,
  error,
}: {
  people: { key: PersonKey; person: InsuredPerson }[];
  selected: PersonKey[];
  onToggle: (key: PersonKey, on: boolean) => void;
  error?: string;
}) {
  return (
    <div className="mt-3 space-y-2 rounded-2xl border border-[#d7e8e3] bg-[#f7fbfa] p-4">
      <p className="text-xs font-extrabold text-[#143834]">על מי חלה התשובה?</p>
      <div className="flex flex-wrap gap-2">
        {people.map(({ key, person }) => {
          const on = selected.includes(key);
          return (
            <button
              key={key}
              type="button"
              aria-pressed={on}
              onClick={() => onToggle(key, !on)}
              className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                on
                  ? "border-[#2f6b63] bg-[#2f6b63] text-white"
                  : "border-[#2f6b63]/25 bg-white text-[#2f6b63] hover:bg-[#e8f4f1]"
              }`}
            >
              {personLabel(key, person)}
            </button>
          );
        })}
      </div>
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  );
}

export function HouseholdHealth({
  people,
  form,
  errors,
  onPatchHealth,
  onPatchPerson,
  onPatchGroup,
}: {
  people: { key: PersonKey; person: InsuredPerson }[];
  form: TravelProposalForm;
  errors: Record<string, string>;
  onPatchHealth: (key: PersonKey, patch: Partial<PersonHealth>) => void;
  onPatchPerson: (key: PersonKey, patch: Partial<InsuredPerson>) => void;
  onPatchGroup: (patch: Partial<TravelProposalForm["healthGroup"]>) => void;
}) {
  const group = form.healthGroup || { q1: "", q2: "", q3: "", q4: "", q5: "" };
  const yesKeys = (pick: (h: PersonHealth) => YesNo) =>
    people.filter(({ person }) => pick(person.health) === "yes").map(({ key }) => key);

  const setGroupNo = (field: GroupKey) => {
    onPatchGroup({ [field]: "no" });
    for (const { key, person } of people) {
      if (field === "q1") onPatchHealth(key, { q1: "no" });
      if (field === "q2") onPatchHealth(key, { q2: "no", q21Conditions: [], q22: "" });
      if (field === "q3") onPatchHealth(key, { q3: "no", q31: "" });
      if (field === "q4") onPatchHealth(key, { q4: "no", q4Details: "" });
      if (field === "q5") {
        onPatchHealth(key, {
          q5Pregnant: person.gender === "female" ? "no" : "",
          q51Week: "",
          q52HighRisk: "",
        });
      }
    }
  };

  const setGroupYes = (field: GroupKey) => {
    onPatchGroup({ [field]: "yes" });
  };

  const toggleWho = (field: GroupKey, key: PersonKey, on: boolean) => {
    if (field === "q1") onPatchHealth(key, { q1: on ? "yes" : "no" });
    if (field === "q2") {
      onPatchHealth(key, on ? { q2: "yes" } : { q2: "no", q21Conditions: [], q22: "" });
    }
    if (field === "q3") {
      onPatchHealth(key, on ? { q3: "yes" } : { q3: "no", q31: "" });
    }
    if (field === "q4") {
      onPatchHealth(key, on ? { q4: "yes" } : { q4: "no", q4Details: "" });
    }
    if (field === "q5") {
      onPatchHealth(
        key,
        on
          ? { q5Pregnant: "yes" }
          : { q5Pregnant: "no", q51Week: "", q52HighRisk: "" },
      );
    }
  };

  const females = people.filter(({ person }) => person.gender === "female");
  const q2YesPeople = people.filter(({ person }) => person.health.q2 === "yes");
  const q3YesPeople = people.filter(({ person }) => person.health.q3 === "yes");
  const q4YesPeople = people.filter(({ person }) => person.health.q4 === "yes");
  const q5YesPeople = females.filter(({ person }) => person.health.q5Pregnant === "yes");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-extrabold text-[#143834]">הצהרת בריאות לכל המבוטחים</h3>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
            השאלות חלות על: {people.map(({ key, person }) => personLabel(key, person)).join(" · ")}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-full border-[#2f6b63]/30 text-[#2f6b63]"
          onClick={() => {
            onPatchGroup({ q1: "no", q2: "no", q3: "no", q4: "no", q5: "no" });
            for (const { key, person } of people) {
              onPatchPerson(key, markAllHealthNo(person));
            }
          }}
        >
          סמן הכל לא
        </Button>
      </div>

      <HealthQuestionCard
        number={1}
        title={Q1_TITLE.replace(/^1\.\s*/, "")}
        note={Q1_NOTE}
        value={group.q1}
        onChange={(v) => (v === "yes" ? setGroupYes("q1") : setGroupNo("q1"))}
        error={errors.q1who || errors.healthq1}
      >
        {group.q1 === "yes" && (
          <>
            <WhoPicker
              people={people}
              selected={yesKeys((h) => h.q1)}
              onToggle={(key, on) => toggleWho("q1", key, on)}
              error={errors.q1who}
            />
            {yesKeys((h) => h.q1).length > 0 && (
              <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
                {Q1_REJECT}
              </p>
            )}
          </>
        )}
      </HealthQuestionCard>

      <HealthQuestionCard
        number={2}
        title={Q2_TITLE.replace(/^2\.\s*/, "")}
        note={Q2_EXCEPTIONS}
        value={group.q2}
        onChange={(v) => (v === "yes" ? setGroupYes("q2") : setGroupNo("q2"))}
        error={errors.q2who || errors.healthq2}
      >
        {group.q2 === "yes" && <p className="mt-2 text-[11px] font-semibold text-[#1f4b46]">{Q2_IF_YES}</p>}
        {group.q2 === "no" && <p className="mt-2 text-[11px] text-slate-500">{Q2_IF_NO}</p>}
        {group.q2 === "yes" && (
          <WhoPicker
            people={people}
            selected={yesKeys((h) => h.q2)}
            onToggle={(key, on) => toggleWho("q2", key, on)}
            error={errors.q2who}
          />
        )}
        {q2YesPeople.map(({ key, person }) => {
          const h = person.health;
          const q21Yes = h.q21Conditions.length > 0;
          return (
            <div key={key} className="mt-3 space-y-4 rounded-2xl border border-[#d7e8e3] bg-[#f7fbfa] p-4">
              <p className="text-xs font-extrabold text-[#143834]">{personLabel(key, person)}</p>
              <div className="space-y-2">
                <p className="text-xs font-extrabold text-[#143834]">{Q21_TITLE}</p>
                <div className="grid gap-2">
                  {Q21_OPTIONS.map((c) => (
                    <label
                      key={c.id}
                      className="flex items-start gap-2.5 rounded-xl border border-white bg-white px-3 py-2.5 text-xs leading-relaxed text-slate-700"
                    >
                      <Checkbox
                        checked={h.q21Conditions.includes(c.id)}
                        onCheckedChange={(checked) => {
                          const next = checked
                            ? [...h.q21Conditions, c.id]
                            : h.q21Conditions.filter((x) => x !== c.id);
                          onPatchHealth(key, { q21Conditions: next });
                        }}
                        className="mt-0.5"
                      />
                      <span>{c.labelHe}</span>
                    </label>
                  ))}
                </div>
                {!q21Yes && (
                  <p className="text-[11px] font-semibold text-amber-800">{Q21_NEGATIVE_EXT}</p>
                )}
              </div>
              <div className="space-y-2">
                <p className="text-xs font-extrabold text-[#143834]">{Q22_TITLE}</p>
                <p className="text-[11px] leading-relaxed text-slate-600">{Q22_BODY}</p>
                <div className="flex justify-end">
                  <PillYesNo
                    value={h.q22}
                    onChange={(v) => onPatchHealth(key, { q22: v })}
                    name={`q22-${key}`}
                  />
                </div>
                {errors[`${key}.q22`] && <p className="text-xs text-rose-600">{errors[`${key}.q22`]}</p>}
              </div>
              {(q21Yes || h.q22 === "yes") && (
                <p className="rounded-xl bg-white px-3 py-2 text-[11px] leading-relaxed text-slate-600">
                  {Q2_POSITIVE_DOC}
                </p>
              )}
            </div>
          );
        })}
      </HealthQuestionCard>

      <HealthQuestionCard
        number={3}
        title={Q3_TITLE.replace(/^3\.\s*/, "")}
        note={`${Q3_TOPICS} ${Q3_NOTE}`}
        value={group.q3}
        onChange={(v) => (v === "yes" ? setGroupYes("q3") : setGroupNo("q3"))}
        error={errors.q3who || errors.healthq3}
      >
        {group.q3 === "yes" && <p className="mt-2 text-[11px] font-semibold text-[#1f4b46]">{Q3_IF_YES}</p>}
        {group.q3 === "no" && <p className="mt-2 text-[11px] text-slate-500">{Q3_IF_NO}</p>}
        {group.q3 === "yes" && (
          <WhoPicker
            people={people}
            selected={yesKeys((h) => h.q3)}
            onToggle={(key, on) => toggleWho("q3", key, on)}
            error={errors.q3who}
          />
        )}
        {q3YesPeople.map(({ key, person }) => (
          <div key={key} className="mt-3 space-y-2 rounded-2xl border border-[#d7e8e3] bg-[#f7fbfa] p-4">
            <p className="text-xs font-extrabold text-[#143834]">{personLabel(key, person)}</p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <p className="min-w-0 flex-1 text-xs font-extrabold text-[#143834]">{Q31_TITLE}</p>
              <div className="shrink-0 self-end sm:ms-auto sm:self-center">
                <PillYesNo
                  value={person.health.q31}
                  onChange={(v) => onPatchHealth(key, { q31: v })}
                  name={`q31-${key}`}
                />
              </div>
            </div>
            {errors[`${key}.q31`] && <p className="text-xs text-rose-600">{errors[`${key}.q31`]}</p>}
            {person.health.q31 === "no" && (
              <p className="text-[11px] leading-relaxed text-slate-600">{Q31_IF_NO}</p>
            )}
            {person.health.q31 === "yes" && (
              <p className="text-[11px] font-semibold text-amber-800">{Q31_IF_YES}</p>
            )}
          </div>
        ))}
      </HealthQuestionCard>

      <HealthQuestionCard
        number={4}
        title={Q4_TITLE.replace(/^4\.\s*/, "")}
        value={group.q4}
        onChange={(v) => (v === "yes" ? setGroupYes("q4") : setGroupNo("q4"))}
        error={errors.q4who || errors.healthq4}
      >
        {group.q4 === "yes" && (
          <WhoPicker
            people={people}
            selected={yesKeys((h) => h.q4)}
            onToggle={(key, on) => toggleWho("q4", key, on)}
            error={errors.q4who}
          />
        )}
        {q4YesPeople.map(({ key, person }) => (
          <div key={key} className="mt-3 space-y-2">
            <p className="text-xs font-extrabold text-[#143834]">{personLabel(key, person)}</p>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700">{Q4_DETAILS_LABEL}</label>
            <Textarea
              className="min-h-[80px] rounded-2xl border-slate-200 bg-slate-50/80 text-right"
              value={person.health.q4Details}
              onChange={(e) => onPatchHealth(key, { q4Details: e.target.value })}
              placeholder={Q4_DETAILS_HINT}
            />
            <p className="text-[11px] leading-relaxed text-slate-600">{Q4_IF_YES}</p>
          </div>
        ))}
      </HealthQuestionCard>

      {females.length > 0 && (
        <div className="space-y-3 rounded-[22px] border border-rose-100 bg-rose-50/20 p-4">
          <p className="text-xs font-extrabold text-[#143834]">{PREGNANCY_SECTION_TITLE}</p>
          <HealthQuestionCard
            number={5}
            title={Q5_TITLE.replace(/^5\.\s*/, "")}
            value={group.q5}
            onChange={(v) => (v === "yes" ? setGroupYes("q5") : setGroupNo("q5"))}
            error={errors.q5who || errors.healthq5}
          >
            {group.q5 === "yes" && (
              <WhoPicker
                people={females}
                selected={yesKeys((h) => h.q5Pregnant)}
                onToggle={(key, on) => toggleWho("q5", key, on)}
                error={errors.q5who}
              />
            )}
          </HealthQuestionCard>
          {q5YesPeople.map(({ key, person }) => (
            <div key={key} className="space-y-3 rounded-2xl border border-rose-100 bg-white p-4">
              <p className="text-xs font-extrabold text-[#143834]">{personLabel(key, person)}</p>
              <div className="text-right">
                <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-slate-700">
                  {Q51_TITLE}
                  <span className="text-rose-500">*</span>
                </label>
                <Input
                  className="h-11 rounded-xl border-slate-200 bg-slate-50/80"
                  inputMode="numeric"
                  value={person.health.q51Week}
                  onChange={(e) =>
                    onPatchHealth(key, { q51Week: e.target.value.replace(/\D/g, "").slice(0, 2) })
                  }
                />
                {errors[`${key}.q51`] && (
                  <p className="mt-1 text-xs text-rose-600">{errors[`${key}.q51`]}</p>
                )}
              </div>
              <HealthQuestionCard
                number="5.2"
                title={Q52_TITLE.replace(/^5\.2\s*/, "")}
                value={person.health.q52HighRisk}
                onChange={(v) => onPatchHealth(key, { q52HighRisk: v })}
                error={errors[`${key}.q52`]}
              >
                {person.health.q52HighRisk === "yes" && (
                  <p className="mt-3 rounded-xl bg-rose-100/80 px-3 py-2 text-xs font-semibold text-rose-700">
                    {Q52_REJECT}
                  </p>
                )}
                {person.health.q52HighRisk === "no" && (
                  <p className="mt-3 text-[11px] font-semibold text-amber-800">{PREGNANCY_EXT_NOTE}</p>
                )}
                <p className="mt-2 text-[11px] leading-relaxed text-slate-500">{PREGNANCY_AGE_NOTE}</p>
              </HealthQuestionCard>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
