import { useParams } from "react-router-dom";
import CareerPathwaysSection from "../components/CareerPathwaysSection.jsx";
import PageBackgroundLogo from "../components/PageBackgroundLogo.jsx";

export default function CareerPathwaysPage() {
  const { slug } = useParams();

  return (
    <div className="oc-pathways-page-wrapper oc-curriculum-wrapper position-relative">
      <PageBackgroundLogo
        variant="global"
        className="oc-curriculum-bg-logo"
        opacity={0.18}
        size="min(860px, 88vw)"
      />
      <CareerPathwaysSection initialSlug={slug} showHeaderBack={true} />
    </div>
  );
}
