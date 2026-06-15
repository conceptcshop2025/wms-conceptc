import { type UpsellCampaignProps } from "@/app/types/types"

export function getUpsellCampaigns () {
  const activeCampaigns:UpsellCampaignProps[] = [
    {
      name: "Product List in PDP",
      id: "df4a206c",
      color: "oklch(68.5% 0.169 237.323)",
      begginingDate: "26-05-2026",
      campaignStatus: "active"
    },
    {
      name: "Test MC Air Libre",
      id: "25467e5c",
      color: "oklch(76.9% 0.188 70.08)",
      begginingDate: "26-05-2026",
      campaignStatus: "draft"
    },
    {
      name: "Upsell Popup before Checkout page",
      id: "bcf05642",
      color: "oklch(76.8% 0.233 130.85)",
      begginingDate: "27-05-2026",
      campaignStatus: "active"
    },
    {
      name: "26-06-03 Checkout page + Test GPT",
      id: "ddb9ba2a",
      color: "oklch(60.6% 0.25 292.717)",
      begginingDate: "03-06-2026",
      campaignStatus: "active"
    },
    {
      name: "26-02-12 Air Libre (2) sur collection",
      id: "14a21c63",
      color: "oklch(60.6% 0.25 292.717)",
      begginingDate: "12-06-2026",
      campaignStatus: "active"
    }
  ];

  return activeCampaigns;
}