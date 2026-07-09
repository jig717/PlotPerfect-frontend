export default function BottomNav(){

const menu = [
"Home",
"Insights",
"Sell/Rent",
"Shortlist",
"Profile"
]

return(

<div className="fixed md:hidden bottom-0 left-0 right-0 bg-white border-t flex justify-around py-2 text-xs">

{menu.map((item)=>(
<button
key={item}
className="text-gray-600"
>
{item}
</button>
))}

</div>

)
}