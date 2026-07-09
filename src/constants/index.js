export const THEME = {
  bg:'#f8f7ff', bg2:'#f0eeff', bg3:'#e8e4ff', bg4:'#ddd8ff', surf:'#ffffff',
  pu:'#7c3aed', pu2:'#a78bfa', pu3:'#ede9fe', pu4:'#6d28d9', pu5:'#5b21b6',
  tx:'#1a0a2e', tx2:'rgba(26,10,46,0.65)', tx3:'rgba(26,10,46,0.4)',
  br:'rgba(124,58,237,0.15)', br2:'rgba(124,58,237,0.3)',
}

export const ROLES = {
  BUYER:'buyer', OWNER:'owner', AGENT:'agent', ADMIN:'admin',
}

export const PROPERTY_TYPES = [
  { value:'apartment',    label:'Apartment / Flat',    icon:'🏢' },
  { value:'house',        label:'Independent House',   icon:'🏠' },
  { value:'villa',        label:'Villa',               icon:'🏡' },
  { value:'plot',         label:'Plot / Land',         icon:'🌳' },
  { value:'commercial',   label:'Commercial',          icon:'🏬' },
  { value:'pg',           label:'PG / Hostel',         icon:'🛏️' },
  { value:'office',       label:'Office Space',        icon:'🏪' },
  //{ value:'under_construction', label:'Under Construction', icon:'🏗️' },
]

export const LISTING_TYPES = [
  { value:'sale',  label:'For Sale',  color:'#7c3aed' },
  { value:'rent',  label:'For Rent',  color:'#0284c7' },
  { value:'pg',    label:'PG',        color:'#16a34a' },
  { value:'lease', label:'Lease',     color:'#ea580c' },
]

export const BHK_OPTIONS = [
  { value:'',   label:'Any BHK' },
  { value:'1',  label:'1 BHK'   },
  { value:'2',  label:'2 BHK'   },
  { value:'3',  label:'3 BHK'   },
  { value:'4',  label:'4 BHK'   },
  { value:'4+', label:'4+ BHK'  },
]

export const BUDGET_RANGES = [
  { value:'',                label:'Any Budget'     },
  { value:'0-3000000',       label:'Under ₹30L'     },
  { value:'3000000-6000000', label:'₹30L – ₹60L'   },
  { value:'6000000-10000000',label:'₹60L – ₹1Cr'   },
  { value:'10000000-20000000',label:'₹1Cr – ₹2Cr'  },
  { value:'20000000+',       label:'Above ₹2Cr'    },
]

export const CITIES = [
  { name:'Mumbai',    count:'1.2L', emoji:'🌊' },
  { name:'Bangalore', count:'98K',  emoji:'🌿' },
  { name:'Delhi NCR', count:'1.5L', emoji:'🏛'  },
  { name:'Hyderabad', count:'87K',  emoji:'💎' },
  { name:'Pune',      count:'72K',  emoji:'🎓' },
  { name:'Chennai',   count:'64K',  emoji:'🌴' },
  { name:'Ahmedabad', count:'55K',  emoji:'🏺' },
  { name:'Kolkata',   count:'48K',  emoji:'🌸' },
]

export const AMENITIES = [
  'Parking','Gym','Swimming Pool','Security','Lift',
  'Power Backup','Club House','Garden','CCTV','Wi-Fi',
  'Gas Pipeline','Intercom','Fire Safety','Rainwater Harvesting',
]

export const FURNISHING = [
  { value:'unfurnished',    label:'Unfurnished'     },
  { value:'semi_furnished', label:'Semi-Furnished'  },
  { value:'fully_furnished',label:'Fully Furnished' },
]

export const SORT_OPTIONS = [
  { value:'newest',    label:'Newest First'      },
  { value:'price_asc', label:'Price: Low → High' },
  { value:'price_desc',label:'Price: High → Low' },
  { value:'popular',   label:'Most Popular'      },
]