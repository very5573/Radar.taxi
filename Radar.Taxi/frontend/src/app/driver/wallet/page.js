"use client";

import BottomNav from "../components/BottomNav";

export default function WalletPage(){

return(

<div className="min-h-screen pb-16">

<h1 className="text-center text-2xl font-bold mt-4">

Wallet

</h1>


<div className="p-6">

<p>

Balance : ₹500

</p>


</div>


<BottomNav/>

</div>

)
}