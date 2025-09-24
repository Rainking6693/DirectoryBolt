import Head from 'next/head'
import StreamlinedPricing from '../components/pricing/StreamlinedPricing'

export default function TestStreamlinedPricing() {
  return (
    <>
      <Head>
        <title>Streamlined Pricing - DirectoryBolt</title>
        <meta name="description" content="Test the new streamlined pricing flow" />
      </Head>
      <StreamlinedPricing />
    </>
  )
}
