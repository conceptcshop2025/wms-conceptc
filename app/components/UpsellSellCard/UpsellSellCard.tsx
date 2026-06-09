import { type UpsellSellCardProps } from "@/app/types/types"

export default function UpsellSellCard({ campaignTitle }:UpsellSellCardProps) {
  return (
    <div className="upsell-sell-card">
      <div className="heading-card">
        Campagne: { campaignTitle }
      </div>
      <div className="body-card">
        
      </div>
    </div>
  )
}