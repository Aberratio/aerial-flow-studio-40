import { useNavigate } from "react-router-dom";
import PricingPlansModal from "@/components/PricingPlansModal";

const PricingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-tr from-black to-purple-950/10 flex items-center justify-center p-6">
      <PricingPlansModal isOpen={true} onClose={() => navigate("/feed")} />
    </div>
  );
};

export default PricingPage;
