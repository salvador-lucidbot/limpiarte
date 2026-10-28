"use client";

import { MessageCircleQuestionMark, NotebookText, Plus, Search } from "lucide-react";
import { createLocalKey, moveByKey, patchByKey, removeByKey } from "../list-editing";
import { RowControls } from "../row-controls";
import { Button, Field, inputClass, textareaClass } from "../ui";
import { EditorNote, EditorSection, EmptyRows } from "./editor-section";
import { fieldSetter } from "./product-form-model";
import type { ProductFormFaq, ProductFormUpdater, ProductFormValue } from "./product-form-model";
import { PRODUCT_SECTION_ID } from "./product-sections";

interface TextSectionsProps {
  value: ProductFormValue;
  onUpdate: ProductFormUpdater;
}

export function TechnicalSheetSection({ value, onUpdate }: TextSectionsProps): React.ReactNode {
  const set = fieldSetter(onUpdate);
  return (
    <EditorSection
      id={PRODUCT_SECTION_ID.technicalSheet}
      icon={NotebookText}
      title="Descripción y ficha técnica"
      description="La descripción larga va en «Descripción del producto»; el resto forma la ficha técnica de «Información del producto»."
    >
      <div className="space-y-4">
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
          <Field label="Rendimiento">
            <textarea rows={2} value={value.performance} onChange={(event) => set("performance", event.target.value)} className={textareaClass} />
          </Field>
          <Field label="Precauciones">
            <textarea rows={2} value={value.precautions} onChange={(event) => set("precautions", event.target.value)} className={textareaClass} />
          </Field>
        </div>
        <Field label="Modo de uso" hint="Si cargas material en «Modo de uso», este texto sale en esa sección en lugar de la tabla.">
          <textarea rows={3} value={value.usageInstructions} onChange={(event) => set("usageInstructions", event.target.value)} className={textareaClass} />
        </Field>
        <EditorNote>El modo de uso y las precauciones se muestran en «Materiales y cuidado» de la ficha técnica.</EditorNote>
      </div>
    </EditorSection>
  );
}

export function FaqSection({ value, onUpdate }: TextSectionsProps): React.ReactNode {
  function patchFaq(key: string, patch: Partial<ProductFormFaq>): void {
    onUpdate((current) => ({ ...current, faqs: patchByKey(current.faqs, key, patch) }));
  }

  return (
    <EditorSection
      id={PRODUCT_SECTION_ID.faqs}
      icon={MessageCircleQuestionMark}
      title="Preguntas frecuentes del producto"
      description="Dudas habituales de los clientes con su respuesta, en el orden de la lista."
      actions={
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => onUpdate((current) => ({ ...current, faqs: [...current.faqs, { key: createLocalKey(), question: "", answer: "" }] }))}
        >
          <Plus size={16} aria-hidden="true" />
          Pregunta
        </Button>
      }
    >
      <div className="space-y-4">
        {value.faqs.length === 0 && <EmptyRows icon={MessageCircleQuestionMark}>Sin preguntas frecuentes.</EmptyRows>}
        {value.faqs.length > 0 && (
          <ol className="space-y-3">
            {value.faqs.map((faq, index) => (
              <li key={faq.key} className="flex gap-3 rounded-2xl border border-ink-200 p-4">
                <div className="min-w-0 flex-1 space-y-2">
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
                    className={textareaClass}
                  />
                </div>
                <RowControls
                  label={`la pregunta ${index + 1}`}
                  isFirst={index === 0}
                  isLast={index === value.faqs.length - 1}
                  onMove={(offset) => onUpdate((current) => ({ ...current, faqs: moveByKey(current.faqs, faq.key, offset) }))}
                  onRemove={() => onUpdate((current) => ({ ...current, faqs: removeByKey(current.faqs, faq.key) }))}
                />
              </li>
            ))}
          </ol>
        )}
        <EditorNote>La pregunta y la respuesta necesitan al menos 3 caracteres cada una. Las filas vacías no se guardan.</EditorNote>
      </div>
    </EditorSection>
  );
}

export function SeoSection({ value, onUpdate }: TextSectionsProps): React.ReactNode {
  const set = fieldSetter(onUpdate);
  return (
    <EditorSection
      id={PRODUCT_SECTION_ID.seo}
      icon={Search}
      title="Posicionamiento (SEO) y etiquetas"
      description="Cómo aparece el producto en Google y las etiquetas que ayudan a encontrarlo en la tienda."
    >
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
    </EditorSection>
  );
}
