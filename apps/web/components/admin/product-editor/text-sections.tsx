"use client";

import { IconPlus } from "../../icons";
import { createLocalKey, moveByKey, patchByKey, removeByKey } from "../list-editing";
import { RowControls } from "../row-controls";
import { Button, Card, Field, inputClass, textareaClass } from "../ui";
import { fieldSetter } from "./product-form-model";
import type { ProductFormFaq, ProductFormUpdater, ProductFormValue } from "./product-form-model";

interface TextSectionsProps {
  value: ProductFormValue;
  onUpdate: ProductFormUpdater;
}

export function TechnicalSheetSection({ value, onUpdate }: TextSectionsProps): React.ReactNode {
  const set = fieldSetter(onUpdate);
  return (
    <Card id="producto-ficha" title="Descripción y ficha técnica">
      <div className="grid gap-4">
        <Field label="Descripción larga">
          <textarea rows={5} value={value.description} onChange={(event) => set("description", event.target.value)} className={textareaClass} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Presentación">
            <input value={value.presentation} onChange={(event) => set("presentation", event.target.value)} className={inputClass} />
          </Field>
          <Field label="Contenido">
            <input value={value.technicalContent} onChange={(event) => set("technicalContent", event.target.value)} className={inputClass} />
          </Field>
        </div>
        <Field label="Rendimiento">
          <textarea rows={2} value={value.performance} onChange={(event) => set("performance", event.target.value)} className={textareaClass} />
        </Field>
        <Field label="Modo de uso">
          <textarea rows={2} value={value.usageInstructions} onChange={(event) => set("usageInstructions", event.target.value)} className={textareaClass} />
        </Field>
        <Field label="Precauciones">
          <textarea rows={2} value={value.precautions} onChange={(event) => set("precautions", event.target.value)} className={textareaClass} />
        </Field>
        <p className="text-xs text-stone-400">
          La descripción va en «Descripción del producto»; el resto forma la ficha técnica de «Información del producto» (modo de uso y precauciones se
          muestran en «Materiales y cuidado»).
        </p>
      </div>
    </Card>
  );
}

export function FaqSection({ value, onUpdate }: TextSectionsProps): React.ReactNode {
  function patchFaq(key: string, patch: Partial<ProductFormFaq>): void {
    onUpdate((current) => ({ ...current, faqs: patchByKey(current.faqs, key, patch) }));
  }

  return (
    <Card
      id="producto-preguntas"
      title="Preguntas frecuentes del producto"
      actions={
        <Button
          type="button"
          variant="secondary"
          onClick={() => onUpdate((current) => ({ ...current, faqs: [...current.faqs, { key: createLocalKey(), question: "", answer: "" }] }))}
        >
          <IconPlus size={15} />
          Pregunta
        </Button>
      }
    >
      <div className="space-y-3">
        {value.faqs.map((faq, index) => (
          <div key={faq.key} className="flex gap-2">
            <div className="flex-1 space-y-2">
              <input
                placeholder="Pregunta"
                value={faq.question}
                onChange={(event) => patchFaq(faq.key, { question: event.target.value })}
                aria-label={`Pregunta ${index + 1}`}
                className={inputClass}
              />
              <textarea
                placeholder="Respuesta"
                rows={2}
                value={faq.answer}
                onChange={(event) => patchFaq(faq.key, { answer: event.target.value })}
                aria-label={`Respuesta ${index + 1}`}
                className={inputClass}
              />
            </div>
            <RowControls
              label={`la pregunta ${index + 1}`}
              isFirst={index === 0}
              isLast={index === value.faqs.length - 1}
              onMove={(offset) => onUpdate((current) => ({ ...current, faqs: moveByKey(current.faqs, faq.key, offset) }))}
              onRemove={() => onUpdate((current) => ({ ...current, faqs: removeByKey(current.faqs, faq.key) }))}
            />
          </div>
        ))}
        {value.faqs.length === 0 && <p className="text-sm text-stone-400">Sin preguntas frecuentes.</p>}
        <p className="text-xs text-stone-400">La pregunta y la respuesta necesitan al menos 3 caracteres cada una. Las filas vacías no se guardan.</p>
      </div>
    </Card>
  );
}

export function SeoSection({ value, onUpdate }: TextSectionsProps): React.ReactNode {
  const set = fieldSetter(onUpdate);
  return (
    <Card id="producto-seo" title="Posicionamiento (SEO) y etiquetas">
      <div className="grid gap-4">
        <Field label="Título SEO">
          <input value={value.seoTitle} onChange={(event) => set("seoTitle", event.target.value)} className={inputClass} />
        </Field>
        <Field label="Meta descripción">
          <textarea rows={2} value={value.seoDescription} onChange={(event) => set("seoDescription", event.target.value)} className={textareaClass} />
        </Field>
        <Field label="Etiquetas (separadas por coma)">
          <input placeholder="desinfectante, multiusos" value={value.tags} onChange={(event) => set("tags", event.target.value)} className={inputClass} />
        </Field>
      </div>
    </Card>
  );
}
