import * as dotenv from 'dotenv'
dotenv.config();

import { Button, Frog, FrameIntent} from 'frog'
import { neynar } from 'frog/hubs'
import { handle } from 'frog/vercel'
import { devtools } from 'frog/dev'
import { serveStatic } from 'frog/serve-static'

import { DelegatesResponseDTO } from './service/delegatesResponseDTO.js';
import { addressCount, suggestionResponseDTO } from './service/suggestionResponseDTO.js';

// Uncomment to use Edge Runtime.
// export const config = {
// runtime: 'edge',
// }

export const app = new Frog({
  assetsPath: '/',
  basePath: '/api',
  hub: neynar({ apiKey: 'NEYNAR_FROG_FM' }),
  title: 'Delegates Frame',
/*   verify: 'silent', */
  imageOptions: {
    fonts: [
      {
        name: 'Koulen',
        weight: 400,
        source: 'google',
      }
    ]
  }
})

app.frame('/', (c) => {
  return c.res({
    image: `/Frame_1_start.png`,
    imageAspectRatio: '1.91:1',
    intents: [
      <Button action="/delegatesStats">View Stats</Button>
    ],
  })
})

app.frame('/delegatesStats', async (c) => {
  /* const {  frameData } = c;
 const { fid } = frameData || {}  */  

 /* const { inputText } = c;
  const identifier = inputText === undefined ? c.frameData?.fid : Number(inputText) */
 const fid = 376182;


 if (typeof fid !== 'number' || fid === null){
  return c.res({
    image: `/Frame_6_error.png`,
    imageAspectRatio: '1.91:1',
    intents: [
      <Button.Reset>Try again</Button.Reset>,
    ],
  })
}

let delegate: DelegatesResponseDTO;

try {

  const delegateApiURL = new URL(`${process.env.DELEGATE_API_URL}/get_stats`);

  if (fid === undefined) {
    throw new Error('FID is undefined');
  }

  delegateApiURL.searchParams.append('fid', fid.toString());

  const response = await fetch(delegateApiURL.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  delegate = await response.json();

} catch (e) {
  console.error('Error fetching delegate data:', e);

  return c.res({
    image: `/Frame_6_error.png`,
    imageAspectRatio: '1.91:1',
    intents: [
      <Button.Reset>Try again</Button.Reset>,
    ],
  });
}

  if (!delegate.hasVerifiedAddress){
    return c.res({
      image: `/Frame_4_not_verified.png`,
      imageAspectRatio: '1.91:1',
      intents: [
          <Button.Reset>Try again</Button.Reset>,
      ],
  })
  }
  
  if(!delegate.hasDelegate) {
    return c.res({
      image: `/Frame_5_no_delegate.png`,
      imageAspectRatio: '1.91:1',
      intents: [
        <Button action='/exploreDelegates'>Explore delegates</Button>,
        <Button.Reset>Reset</Button.Reset>,
      ],
    })
  }

  const userDelegate = delegate.delegateInfo.warpcast
  const addressDelegate = delegate.delegateInfo.delegateAddress

  const delegateData = userDelegate? userDelegate : addressDelegate
  if(!delegate.isGoodDelegate) {

    return c.res({
        image: (          
          <div style={{
            display: 'flex',
            background: '#f6f6f6',
            width: '100%',
            height: '100%',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            alignItems: 'center',
            position: 'relative'
            }}>
            <img width="1200" height="630" alt="background" src={`/Frame_2.1_bad_delegate_stats.png`}/>
            <div
              style={{
                position: 'absolute',
                color: '#E5383B',
                fontSize: '75px',
                lineHeight: '0.7',
                textTransform: 'uppercase',
                letterSpacing: '-0.030em',
                whiteSpace: 'wrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                with: '100%',
                maxWidth: '255px',
                height: '100%',
                maxHeight: '340px',
                left: '190px',
                bottom: '230px',
                justifyContent: 'flex-start',
                alignItems: 'flex-start',
              }}>
              {`${delegateData}`}
            </div>
          </div>
        ),
        intents: [
          <Button action='/exploreDelegates'>Explore delegates</Button>,
        ],
      })
  }


  if (typeof userDelegate !== 'string' || userDelegate === null) {
    throw new Error('Invalid type returned');
  }
    return c.res({
        image: (          
          <div style={{
            display: 'flex',
            background: '#f6f6f6',
            width: '100%',
            height: '100%',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            alignItems: 'center',
            position: 'relative'
            }}>
            <img width="1200" height="630" alt="background" src={`/Frame_2_stats.png`} />
            <div
              style={{
                position: 'absolute',
                color: '#E5383B',
                fontSize: '75px',
                lineHeight: '0.7',
                textTransform: 'uppercase',
                letterSpacing: '-0.030em',
                whiteSpace: 'wrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                with: '100%',
                maxWidth: '240px',
                height: '100%',
                maxHeight: '340px',
                left: '195px',
                bottom: '230px',
                justifyContent: 'flex-start',
                alignItems: 'flex-start',
              }}>
              {`${delegateData}`}
            </div>
          </div>
        ),
        intents: [
          <Button.Link href='https://warpcast.com/lauraocampo'>Share</Button.Link>,
          <Button.Reset>Reset</Button.Reset>
        ],
      })

})

function getOrdinalSuffix(index: number): string {
  const suffixes = ["th", "st", "nd", "rd"];
  const value = index % 100;
  return suffixes[(value - 20) % 10] || suffixes[value] || suffixes[0];
}

function getIntents(delegates: addressCount[]) : FrameIntent[]{
  return delegates.map((delegate: addressCount, index: number) => {
    const position = index+1
    return <Button.Link href={`https://vote.optimism.io/delegates/${delegate.address}`}>{`${position}${getOrdinalSuffix(position)} Delegate`}</Button.Link>
  })
}

app.frame('/exploreDelegates', async (c) => {
  /* const {  frameData } = c;
  const { fid } = frameData || {}    */
  const fid = 376182;


  if (typeof fid !== 'number' || fid === null) {
    return c.res({
      image: `/Frame_6_error.png`,
      imageAspectRatio: '1.91:1',
      intents: [<Button.Reset>Try again</Button.Reset>],
    });
  }
  let delegates: suggestionResponseDTO 

  try {
    const delegateApiURL = new URL(`${process.env.DELEGATE_API_URL}/get_suggested_delegates`);
    delegateApiURL.searchParams.append('fid', fid.toString());

    const response = await fetch(delegateApiURL.toString(), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    delegates = await response.json();

} catch (error) {
  console.error('Error fetching delegate data:', error);
  return c.res({
    image: `/Frame_6_error.png`,
    imageAspectRatio: '1.91:1',
    intents: [<Button.Reset>Try again</Button.Reset>],
  });
}
if (delegates.length === 0) {
  return c.res({
    image: `/back2.png`,
    imageAspectRatio: '1.91:1',
    intents: [<Button.Reset>Try again</Button.Reset>],
  });
}

const intents = getIntents(delegates);
intents.push(<Button.Reset>Reset</Button.Reset>);

return c.res({
image: (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        position: 'absolute',
        color: '#161B33',
        fontSize: '70px',
        textTransform: 'uppercase',
        letterSpacing: '-0.030em',
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        boxSizing: 'border-box',
        alignItems: 'center',
        lineHeight: 1.4,
        padding: '0px 50px',
        overflow: 'hidden', 
        textOverflow: 'ellipsis',
        textAlign: 'center', 
      }}>
        <div style={{
            display: 'flex',
            flexDirection: 'row',
            width: '100%',
            maxWidth: '100%',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: '10px'
        }}>
            <h1></h1>
            <ul style={{
              display: 'flex',
              flexDirection: 'column',
              listStyleType: 'none',
              padding: '0',
              margin: '0',
              width: '40%',
              boxSizing: 'border-box'
            }}>
              {delegates.map((item, index) => (
                <li key={index} style={{
                  margin: '10px 0',
                  padding: '5px',
                  borderBottom: '1px solid #ddd',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>{item.address}</li>
              ))}
            </ul>
          
            <ul style={{
              display: 'flex',
              flexDirection: 'column',
              listStyleType: 'none',
              padding: 0,
              margin: '0',
              width: '20%',
              boxSizing: 'border-box',
            }}>
              {delegates.map((item, index) => (
                <li key={index} style={{ margin: '10px 0',
                  padding: '5px',
                  borderBottom: '1px solid #ddd',
                  justifyContent: 'flex-end', }}>{item.count}</li>
              ))}
            </ul>
        </div>
<<<<<<< HEAD
    </div>
=======
    </div>
  </div>
>>>>>>> d6b57b26093918c0e65cce761bb8552b04bd0747
),
intents,
});

})

// @ts-ignore
const isEdgeFunction = typeof EdgeFunction !== 'undefined'
const isProduction = isEdgeFunction || import.meta.env?.MODE !== 'development'
devtools(app, isProduction ? { assetsPath: '/.frog' } : { serveStatic })

export const GET = handle(app)
export const POST = handle(app)