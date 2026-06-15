"use client";

import { useCallback, useState } from "react";
import Menu from "../components/Menu/Menu";
import { Bars3Icon, DocumentCurrencyDollarIcon } from "@heroicons/react/24/outline";
import { type SelledProductsByUpsellProps, type UpsellCampaignProps } from "../types/types";
import UpsellSellCard from "../components/UpsellSellCard/UpsellSellCard";
import { fetchBulkUpsellOrders } from "../actions/upsell-orders";
import InfoAppVersion from "../components/InfoAppVersion/InfoAppVersion";
import Loading from "../components/Loading/Loading";
import DatePicker from "../components/DatePicker/DatePicker";
import { toast } from "sonner";
import { getUpsellCampaigns } from "../lib/data/getUpsellCampaigns";

export default function UpsellStatsPage() {
  const [loading, setLoading] = useState<boolean>(false);
  const [openMenu, setOpenMenu] = useState<boolean>(false);
  const [selledProducts, setSelledProducts] = useState<SelledProductsByUpsellProps[]>([]);
  const [datePickerInitialDate, setDatePickerInitialDate] = useState<string>('');
  const [datePickerFinalDate, setDatePickerFinalDate] = useState<string>('');
  const activeCampaigns:UpsellCampaignProps[] = getUpsellCampaigns();

  const toggleMenu = () => {
    setOpenMenu(prev => !prev);
  }

  const getUpsellStats = async () => {
    setLoading(true);
    try {
      const bulkOperationsOfUpsellOrders = await fetchBulkUpsellOrders(datePickerInitialDate, datePickerFinalDate);
      setSelledProducts(bulkOperationsOfUpsellOrders);
    } catch(error) {
      toast.error(`Erreur: L'obtention de l'information de ventes d'upsell est refusé, validéz le range des dates et essayez autre fois. error info: ${error}`, {
        position: "top-center",
        richColors: true
      });
    } finally {
      setLoading(false);
    }
  }

  const filteredDataByCampaign = (campaignId:string) => {
    const filterByCampaign = selledProducts.filter(p => p.campaignId.split('offer#')[1] === campaignId);
    const mergedBySku = filterByCampaign.reduce<Record<string, SelledProductsByUpsellProps>>(
      (acc, product) => {
        const existing = acc[product.sku];
        if (existing) {
          existing.quantity += product.quantity;
        } else {
          acc[product.sku] = { ...product };
        }
        return acc;
      },
      {}
    );
    
    return Object.values(mergedBySku).sort((a, b) => b.quantity - a.quantity).slice(0, 10);
  }

  const handlePickerDate = useCallback((initialDate:string, finalDate:string) => {
    setDatePickerInitialDate(initialDate);
    setDatePickerFinalDate(finalDate);
  },[]);

  return (
    <div className="map-bin-page">
          <Menu isOpen={openMenu} onCloseMenu={toggleMenu} />
          <div className="topbar">
            <div className="topbar-left">
              <div className="logo-mark cursor-pointer bg-green-800!" onClick={toggleMenu}>
                <Bars3Icon className="size-6" />
              </div>  
              <div>
                <div className="logo-text">CONCEPT C</div>
                <div className="logo-sub">WMS · Québec</div>
              </div>
            </div> 
            <InfoAppVersion />
          </div>
          <main className="p-8!">
            {
              loading ?
                <Loading text={"Chargement des données"} /> :
                  <>
                    <div className="flex gap-4 justify-start items-center">
                      <DatePicker onPickerDate={handlePickerDate} />
                      <button className="action-btn bg-sky-400! text-neutral-100!" onClick={getUpsellStats}>
                        <DocumentCurrencyDollarIcon className="size-6! text-neutral-100!" />
                        Consulter ventes
                      </button>
                    </div>
                    <div className="campaigns-container grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4!">
                      {
                        selledProducts.length === 0 ? <p>Sélectionne un range des dates et cliques sur consulter ventes.</p>
                        : activeCampaigns.length === 0
                        ? <p>Pas de campagnes actives en ce moment.</p>
                        : (
                          activeCampaigns.map((campaign:UpsellCampaignProps) => (
                            campaign.campaignStatus === 'active' && <UpsellSellCard
                              campaignTitle={campaign.name}
                              colorCard={campaign.color}
                              begginingDate={campaign.begginingDate}
                              data={filteredDataByCampaign(campaign.id)} key={campaign.id} />
                          ))
                        )
                      }
                    </div>
                  </>
            }
          </main>
        </div>
  )
}