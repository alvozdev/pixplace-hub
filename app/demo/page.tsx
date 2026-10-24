import { PageHead } from "@/components/page-head";
import DemoFlow from "./flow";

export default function Demo() {
  return (
    <div className="space-y-8">
      <PageHead title="Демо" kicker="анимации на пробных данных">
        Так выглядит путь черновика: n8n рисует варианты, вы проверяете и публикуете. Наведите курсор на карточки, чтобы увидеть свет и наклон.
      </PageHead>
      <DemoFlow />
    </div>
  );
}
