"use client";

import { Heading } from "lucide-react";
import { useId } from "react";
import { SectionHeading } from "../../store/product/section-heading";
import { Field, inputClass } from "../ui";
import { EditorNote, EditorSection, PreviewFrame } from "./editor-section";
import { SECTION_TITLE_LIMITS } from "./product-form-model";
import type { ProductFormUpdater, ProductFormValue, SectionTitleKey } from "./product-form-model";
import { PRODUCT_SECTION_ID } from "./product-sections";

interface SectionTitlesSectionProps {
  value: ProductFormValue;
  onUpdate: ProductFormUpdater;
}

interface TitleFieldConfig {
  key: SectionTitleKey;
  label: string;
  placeholder: string;
  hint: string;
}

interface TitleGroupConfig {
  name: string;
  fallbackTitle: string;
  fallbackSubtitle?: string;
  title: TitleFieldConfig;
  subtitle?: TitleFieldConfig;
}

const TITLE_GROUPS: TitleGroupConfig[] = [
  {
    name: "Sobre este artículo",
    fallbackTitle: "Sobre este artículo",
    title: {
      key: "highlightsTitle",
      label: "Título de las viñetas",
      placeholder: "Sobre este artículo",
      hint: "Prueba algo como «¿Qué soluciona el producto?»."
    },
    subtitle: {
      key: "highlightsSubtitle",
      label: "Subtítulo de las viñetas",
      placeholder: "Opcional",
      hint: "Una frase corta bajo el título."
    }
  },
  {
    name: "Descripción del producto",
    fallbackTitle: "Descripción del producto",
    title: {
      key: "descriptionTitle",
      label: "Título de la descripción",
      placeholder: "Descripción del producto",
      hint: "Prueba algo como «Antes y después». Bajo este título van la descripción larga y los bloques de contenido visual del producto."
    },
    subtitle: {
      key: "descriptionSubtitle",
      label: "Subtítulo de la descripción",
      placeholder: "Opcional",
      hint: "Una frase corta bajo el título."
    }
  },
  {
    name: "Modo de uso",
    fallbackTitle: "Modo de uso",
    fallbackSubtitle: "Cómo aplicar el producto para obtener el mejor resultado.",
    title: { key: "usageTitle", label: "Título del modo de uso", placeholder: "Modo de uso", hint: "Prueba algo como «Cómo se usa»." }
  },
  {
    name: "Videos",
    fallbackTitle: "Videos",
    fallbackSubtitle: "Videos de este producto",
    title: { key: "videosTitle", label: "Título de los videos", placeholder: "Videos", hint: "Encabeza la galería de videos del producto." }
  },
  {
    name: "Documentos",
    fallbackTitle: "Documentos",
    fallbackSubtitle: "Fichas técnicas, hojas de seguridad y manuales en PDF.",
    title: { key: "documentsTitle", label: "Título de los documentos", placeholder: "Documentos", hint: "Encabeza la lista de PDF descargables." }
  },
  {
    name: "Desde la marca",
    fallbackTitle: "Desde la marca",
    title: {
      key: "contentTitle",
      label: "Título de «Desde la marca»",
      placeholder: "Desde la marca",
      hint: "Encabeza el contenido de la marca (banner, logo y sus bloques), que se edita en Marcas."
    }
  }
];

function TitleInput({
  config,
  maxLength,
  value,
  onChange
}: {
  config: TitleFieldConfig;
  maxLength: number;
  value: string;
  onChange: (text: string) => void;
}): React.ReactNode {
  return (
    <Field label={config.label} hint={config.hint}>
      <input value={value} maxLength={maxLength} placeholder={config.placeholder} onChange={(event) => onChange(event.target.value)} className={inputClass} />
    </Field>
  );
}

function TitleGroup({ group, value, onUpdate }: { group: TitleGroupConfig; value: ProductFormValue; onUpdate: ProductFormUpdater }): React.ReactNode {
  const headingId = useId();
  const titles = value.sectionTitles;
  const subtitle = group.subtitle;

  function setTitle(key: SectionTitleKey, text: string): void {
    onUpdate((current) => ({ ...current, sectionTitles: { ...current.sectionTitles, [key]: text } }));
  }

  return (
    <article className="grid gap-4 rounded-2xl border border-ink-200 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,18rem)]" aria-label={group.name}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
        <TitleInput config={group.title} maxLength={SECTION_TITLE_LIMITS.title} value={titles[group.title.key]} onChange={(text) => setTitle(group.title.key, text)} />
        {subtitle && (
          <TitleInput
            config={subtitle}
            maxLength={SECTION_TITLE_LIMITS.subtitle}
            value={titles[subtitle.key]}
            onChange={(text) => setTitle(subtitle.key, text)}
          />
        )}
      </div>
      <PreviewFrame title="Vista previa" className="self-start">
        <SectionHeading
          id={headingId}
          title={titles[group.title.key]}
          fallbackTitle={group.fallbackTitle}
          subtitle={subtitle ? titles[subtitle.key] : null}
          fallbackSubtitle={group.fallbackSubtitle}
        />
      </PreviewFrame>
    </article>
  );
}

export function SectionTitlesSection({ value, onUpdate }: SectionTitlesSectionProps): React.ReactNode {
  return (
    <EditorSection
      id={PRODUCT_SECTION_ID.sectionTitles}
      icon={Heading}
      title="Títulos de sección"
      description="Cambia los encabezados de la ficha para contar mejor la historia del producto. Vacío = se usa el título de siempre."
    >
      <div className="space-y-4">
        {TITLE_GROUPS.map((group) => (
          <TitleGroup key={group.title.key} group={group} value={value} onUpdate={onUpdate} />
        ))}
        <EditorNote>Los títulos admiten hasta {SECTION_TITLE_LIMITS.title} caracteres y los subtítulos hasta {SECTION_TITLE_LIMITS.subtitle}.</EditorNote>
      </div>
    </EditorSection>
  );
}
