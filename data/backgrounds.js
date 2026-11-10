/* Achtergrondgalerijen — gratis foto's van Unsplash (unsplash.com/license).
   Elk item is het pad op images.unsplash.com; de grootte wordt bij het laden bepaald.
   Zelf toevoegen: zoek een foto op unsplash.com, open hem, rechtsklik > "Afbeeldingsadres kopiëren"
   en neem het deel na "images.unsplash.com/" tot aan het vraagteken. */
const BG_GALLERIES = {
  mist: {
    name: 'Mist & bos',
    photos: [
      'photo-1544039161-b0c20826c6f6', 'photo-1487621167305-5d248087c724', 'photo-1694282881698-d0197b47305e',
      'photo-1486707471592-8e7eb7e36f78', 'photo-1524959725226-f4deb958e979', 'photo-1784323541047-80bab9d1c397',
      'photo-1601307426703-20d19577e455', 'photo-1541675154750-0444c7d51e8e', 'photo-1531257114315-24a694751517',
      'photo-1766859813732-20a127bb6023', 'photo-1784231882494-5450ad619de9', 'photo-1758243488339-10c80d530943',
    ],
  },
  bergen: {
    name: 'Bergen',
    photos: [
      'photo-1501785888041-af3ef285b470', 'photo-1511300636408-a63a89df3482', 'photo-1554629947-334ff61d85dc',
      'photo-1485470733090-0aae1788d5af', 'photo-1477346611705-65d1883cee1e', 'photo-1480497490787-505ec076689f',
      'photo-1501786223405-6d024d7c3b8d', 'photo-1500964757637-c85e8a162699', 'photo-1506905925346-21bda4d32df4',
      'photo-1478059299873-f047d8c5fe1a', 'photo-1465056836041-7f43ac27dcb5', 'photo-1615729947596-a598e5de0ab3',
      'photo-1552394459-917cbbffbc84',
    ],
  },
  zee: {
    name: 'Zee & kust',
    photos: [
      'photo-1787486432718-6237342aaeb4', 'photo-1596391691172-3359c29c6451', 'photo-1787486432905-60760869fb1f',
      'photo-1760637243905-8f73f60fc240', 'photo-1705966983173-51f80b78da4c', 'photo-1787304530389-89f07fedb990',
      'photo-1683041133509-aab050b20b18', 'photo-1788094330150-89a6e994946b', 'photo-1760210099008-6127f1f2b8b2',
      'photo-1773399149825-bd9bd7dde74f', 'photo-1780914436209-d19620bc82a5', 'photo-1502085671122-2d218cd434e6',
      'photo-1785788682063-5ed9229d8edd',
    ],
  },
  stad: {
    name: 'Stad bij nacht',
    photos: [
      'photo-1506606401543-2e73709cebb4', 'photo-1763831781185-2290dd2ad87f', 'photo-1513061379709-ef0cd1695189',
      'photo-1774979300738-5c8c05e1db6b', 'photo-1611416457332-946853cc75d6', 'photo-1776549821469-e8aab812dba0',
      'photo-1505811210036-052144988918', 'photo-1775162803422-2df11688290b', 'photo-1514439827219-9137a0b99245',
      'photo-1786323476291-719128712ace', 'photo-1498036882173-b41c28a8ba34', 'photo-1444723121867-7a241cacace9',
      'photo-1495430288918-03be19c7c485', 'photo-1580895456895-cfdf02e4c23f',
    ],
  },
  ruimte: {
    name: 'Ruimte',
    photos: [
      'photo-1464802686167-b939a6910659', 'photo-1454789548928-9efd52dc4031', 'photo-1446776811953-b23d57bd21aa',
      'photo-1451187580459-43490279c0fa', 'photo-1537420327992-d6e192287183', 'photo-1566345984367-fa2ba5cedc17',
      'photo-1543722530-d2c3201371e7', 'photo-1608178398319-48f814d0750c', 'photo-1548625361-58a9b86aa83b',
      'photo-1570556319136-3cfc640168a4', 'photo-1502134249126-9f3755a50d78', 'photo-1419242902214-272b3f66ee7a',
      'photo-1538370965046-79c0d6907d47', 'photo-1501862700950-18382cd41497',
    ],
  },
  herfst: {
    name: 'Herfst',
    photos: [
      'photo-1613985212734-166ffb5a513d', 'photo-1628440622704-59047e272aed', 'photo-1759806642296-5ba05e043d84',
      'photo-1698681889353-d39a24b78bac', 'photo-1635533480390-838005c9eb47', 'photo-1696714055909-2377b1460b34',
      'photo-1693754476236-027d0d71ed73', 'photo-1700513742007-3308baa7b34c', 'photo-1508138142660-302e69e74271',
      'photo-1700656106838-5a7d917d2678', 'photo-1603312448224-e2d8c074ce26', 'photo-1637145919816-76a50b7a1d4a',
      'flagged/photo-1552863477-7dc7069090c8', 'photo-1761574015823-f2e3d5133c0e',
    ],
  },
  racen: {
    name: 'Racen',
    photos: [
      'photo-1742744652734-d5ec6598b5da', 'photo-1779885529717-952eb9a81849', 'photo-1774487671647-613e738aa000',
      'photo-1698753047029-05b3011609b7', 'photo-1774487671679-a2e428c0a431', 'photo-1614949194403-9602bdc14a3a',
      'photo-1764392740382-336690c06e7e', 'photo-1775647733227-81681766ff4e', 'photo-1610905376670-5e7e0e8a3cfb',
      'photo-1500741236341-1b7a0f91f1f6', 'photo-1699138346782-8a8b211c3da2', 'photo-1728116693268-125c5d6ad9e2',
    ],
  },
  nederland: {
    name: 'Nederland',
    photos: [
      'photo-1595698251407-8e7e3030a715', 'photo-1534351590666-13e3e96b5017', 'photo-1512470876302-972faa2aa9a4',
      'photo-1584003564911-a7a321c84e1c', 'photo-1547750341-26482cf3a2ac', 'photo-1616321741705-e9a4073af35c',
      'photo-1459679749680-18eb1eb37418', 'photo-1605315188787-e3c8f6bf927a', 'photo-1605101100278-5d1deb2b6498',
      'photo-1557929036-44a5d490d527', 'photo-1595267688272-883f691e4af8', 'photo-1557436552-d1d884f1bb62',
      'photo-1529943247435-a5974e63d6e4', 'photo-1620657110850-91fbec86cfa4', 'photo-1583295125721-766a0088cd3f',
    ],
  },
  abstract: {
    name: 'Abstract',
    photos: [
      'vector-1767642476379-66fee21c3abb', 'vector-1767642476274-6d46dd8dc3f8', 'vector-1745252217999-cbcf278e59ac',
      'vector-1745252060773-a49271fc7b42', 'vector-1748360867010-ae8dad26ca0f', 'vector-1745252001580-7e5f6f3edaba',
      'vector-1768339220685-df4931d0f178', 'vector-1748360892480-fcc439cb8526', 'vector-1745252001580-d29ec62b79aa',
      'vector-1787562372033-4ae0022f5c8d', 'vector-1786458036496-6b699a6cc33a', 'vector-1777617836195-39c408be3150',
      'vector-1777617836069-daf85cb00f8c', 'vector-1758873794698-150080281f13',
    ],
  },
};

/* Kleurverlopen: altijd beschikbaar, ook zonder internet. */
const GRADIENTS = {
  forest: { name: 'Bos', css: 'linear-gradient(160deg, #2f4a3f 0%, #1c2e2a 45%, #0e1a18 100%)' },
  night: { name: 'Nacht', css: 'radial-gradient(ellipse at 30% 20%, #2b3a67 0%, #141b33 50%, #090c17 100%)' },
  sunset: { name: 'Zonsondergang', css: 'linear-gradient(160deg, #f5a96b 0%, #c45c7a 45%, #3b2551 100%)' },
  ocean: { name: 'Oceaan', css: 'linear-gradient(160deg, #3fa7c9 0%, #1d5f8a 50%, #0b2440 100%)' },
  mono: { name: 'Grafiet', css: 'linear-gradient(160deg, #4a4d52 0%, #2a2c30 50%, #151619 100%)' },
  aurora: { name: 'Noorderlicht', css: 'radial-gradient(ellipse at 20% 0%, #3ddc97 0%, transparent 55%), radial-gradient(ellipse at 80% 30%, #4f6bff 0%, transparent 55%), linear-gradient(180deg, #0b1030, #050713)' },
  peach: { name: 'Perzik', css: 'radial-gradient(circle at 15% 20%, #ffd3a5 0%, transparent 50%), radial-gradient(circle at 85% 80%, #fd6585 0%, transparent 55%), linear-gradient(135deg, #ffb88c, #de6262)' },
  lagoon: { name: 'Lagune', css: 'radial-gradient(circle at 80% 10%, #a1ffce 0%, transparent 45%), radial-gradient(circle at 10% 90%, #0061ff 0%, transparent 55%), linear-gradient(135deg, #43cea2, #185a9d)' },
  grape: { name: 'Druif', css: 'radial-gradient(circle at 75% 25%, #c471f5 0%, transparent 50%), radial-gradient(circle at 20% 80%, #fa71cd 0%, transparent 50%), linear-gradient(135deg, #3a1c71, #1a0b2e)' },
  ember: { name: 'Gloed', css: 'radial-gradient(circle at 50% 110%, #ff7e29 0%, #a3241b 35%, #2a0a0a 75%)' },
  mint: { name: 'Mint', css: 'linear-gradient(160deg, #d4fc79 0%, #96e6a1 50%, #3c8d7c 100%)' },
  ink: { name: 'Inkt', css: 'radial-gradient(circle at 30% 30%, #26323f 0%, #0f141a 60%, #07090c 100%)' },
};
