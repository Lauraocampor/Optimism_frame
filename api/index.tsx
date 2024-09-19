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
    image: `/Frame_1_start_op.png`,
    imageAspectRatio: '1.91:1',
    intents: [
      <Button action="/delegatesStats">View Stats</Button>
    ],
  })
})

function truncateMiddle (text: string, maxLength: number) : string{
  if (text.length <= maxLength) return text
  const start = Math.ceil((maxLength - 3) / 2)
  const end = Math.floor((maxLength - 3) / 2)
  return text.slice(0, start) + '...' + text.slice(-end)
}

function truncateWord(str: string, maxLength: number) {
  if (str.length <= maxLength) {
    return str;
  }
  
  return str.slice(0, maxLength) + '...';
}


app.frame('/delegatesStats', async (c) => {
 /* const {  frameData } = c;
 const { fid } = frameData || {} */

 const fid = 192336

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

  /* NO VERIFIED ADDRESS FRAME */

  if (!delegate.hasVerifiedAddress){
    return c.res({
      image: `/Frame_4_not_verified.png`,
      imageAspectRatio: '1.91:1',
      intents: [
          <Button.Reset>Try again</Button.Reset>,
      ],
  })
  }
  
  /* NO DELEGATE FRAME */

  if(!delegate.hasDelegate) {
    return c.res({
      image: `/Frame_5_no_delegate.png`,
      imageAspectRatio: '1.91:1',
      intents: [
        <Button action='/socialRecommendation'>People I follow</Button>,
        <Button action='/randomRecommendation'>Random</Button>,
        <Button.Reset>Reset</Button.Reset>,
      ],
    })
  }

  const userDelegate = truncateWord(delegate.delegateInfo.warpcast, 9)
  const addressDelegate = truncateMiddle(delegate.delegateInfo.delegateAddress, 11)

  const delegateData = userDelegate? userDelegate : addressDelegate
  const delegateUpperCase= delegateData.toUpperCase()


  delegate.isGoodDelegate = false

  /* BAD DELEGATE FRAME */

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
          {/* @ts-ignore */}
          <img width="1200" height="630" alt="background" src={`/Frame_2.1_stats_dynamic.png`} style={{position: 'absolute', width: '100%', height: '100%', objectFit: 'cover'}} />
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              position: 'absolute',
              color: '#161B33',
              fontSize: '65px',
              textTransform: 'uppercase',
              letterSpacing: '-0.035em',
              width: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box',
              alignItems: 'center',
              lineHeight: 0.8,
              padding: '10px',
              overflow: 'hidden', 
              textOverflow: 'ellipsis',
              textAlign: 'center', 
              top: '8%',
              height: '30%',
              whiteSpace: 'wrap'
            }}
          >            
          <div style={{display: 'flex', wordWrap: 'break-word', flexWrap: 'wrap', width: '100%',
    maxWidth: '100%', margin: '0 10px', justifyContent: 'center',}}>Did <div style={{display: 'flex', color: '#E5383B'}}>{delegateUpperCase}</div> vote in the most recent proposal?</div>
          </div>
        </div>
      ),
        intents: [
          <Button action='/socialRecommendation'>Social Graph</Button>,
          <Button action='/randomRecommendation'>Random</Button>,
          <Button.Reset>Reset</Button.Reset>
        ],
      })
  }


  if (typeof userDelegate !== 'string' || userDelegate === null) {
    throw new Error('Invalid type returned');
  }

  /* GOOD DELEGATE FRAME */
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
          {/* @ts-ignore */}
          <img width="1200" height="630" alt="background" src={`/Frame_2_stats_dynamic.png`} style={{position: 'absolute', width: '100%', height: '100%', objectFit: 'cover'}} />
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              position: 'absolute',
              color: '#161B33',
              fontSize: '65px',
              textTransform: 'uppercase',
              letterSpacing: '-0.035em',
              width: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box',
              alignItems: 'flex-start',
              lineHeight: 0.8,
              padding: '10px',
              overflow: 'hidden', 
              textOverflow: 'ellipsis',
              textAlign: 'center', 
              top: '3%',
              height: '30%',
              lineClamp: 2,
              whiteSpace: 'wrap'
            }}
          >            
          <div style={{display: 'flex', wordWrap: 'break-word', lineClamp: 2,  flexWrap: 'wrap', width: '100%',
    maxWidth: '100%', margin: '0 10px', justifyContent: 'center',}}>Did <div style={{display: 'flex', color: '#E5383B'}}>{delegateUpperCase}</div> vote in the most recent proposal?</div>
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

app.frame('/socialRecommendation', async (c) => {
  /*  const {  frameData } = c;
   const { fid } = frameData || {} */
  
   const fid = 192336
  
  
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

  delegates.length = 1

  if (delegates.length === 0) {
    return c.res({
      image: `/Frame_8_no_followers.png`,
      imageAspectRatio: '1.91:1',
      intents: [<Button.Reset>Try again</Button.Reset>],
    });
  }
  
  const intents = getIntents(delegates);
  intents.push(<Button.Reset>Reset</Button.Reset>);
  
  /* ONE DELEGATE FRAME */
  if (delegates.length === 1) {
    return c.res({
      image: (  
  <div
    style={{
      display: 'flex',
      background: '#f6f6f6',
      alignItems: 'center',
      position: 'relative',
    }}
  > 
    <img width="1200" height="630" alt="background" src={`/Frame_3_rec_ONLY_1.png`} />
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
        lineHeight: 1.1,
        boxSizing: 'border-box',
        alignItems: 'center',
        padding: '0px',
        overflow: 'hidden', 
        textOverflow: 'ellipsis',
        textAlign: 'center', 
        top: '26%',
        height: '80%'
      }}>      
      <div style={{
            display: 'flex',
            flexDirection: 'column',
            textAlign: 'center',
            left: '16%',
            width: '100%',
            maxWidth: '100%',
      }}>
        {delegates.map((item, index) => (
          <div key={index} style={{
            display: 'flex',
            flexDirection: 'column',
            margin: '0',
            alignItems: 'center',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: '#E5383B',
            height: 'auto'
          }}>                    
            {truncateMiddle(item.address, 11)}
            <br/>
            {item.count}
          </div>
        ))}
      </div>
    </div>
  </div>
        ),
  intents,
    });
  }
  
  /* TWO DELEGATES FRAME */
  if (delegates.length === 2) {
    return c.res({
      image: (  
  <div
    style={{
      display: 'flex',
      background: '#f6f6f6',
      alignItems: 'center',
      position: 'relative',
    }}
  > 
    <img width="1200" height="630" alt="background" src={`/Frame_3_rec_ONLY_2.png`} />
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
        lineHeight: 1.1,
        boxSizing: 'border-box',
        alignItems: 'center',
        padding: '0px',
        overflow: 'hidden', 
        textOverflow: 'ellipsis',
        textAlign: 'center', 
        top: '18%',
        height: '80%'
      }}>      
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        width: '100%'
      }}>
        {[0, 1].map(colIndex => (
          <div key={colIndex} style={{
            display: 'flex',
            flexDirection: 'column',
            width: '34%',
            margin: '0'
          }}>
            {delegates
              .filter((_, index) => index % 2 === colIndex)
              .map((item, index) => (
                <div key={index} style={{
                  display: 'flex',
                  flexDirection: 'column',
                  margin: '5px 0',
                  alignItems: 'center',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  color: colIndex === 1 ? '#E5383B' : '#36A4B4',
                  height: 'auto'
                }}>                    
                  {truncateMiddle(item.address, 11)}
                  <br/>
                  {item.count}
                </div>
              ))
            }
          </div>
        ))}
      </div>
    </div>
  </div>
        ),
  intents,
    });
  }
  
  /* THREE DELEGATES FRAME */
  return c.res({
  image: (  
  <div
    style={{
      display: 'flex',
      background: '#f6f6f6',
      alignItems: 'center',
      position: 'relative',
    }}
  > 
    <img width="1200" height="630" alt="background" src={`/Frame_3_social.png`} />
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
        lineHeight: 1.1,
        boxSizing: 'border-box',
        alignItems: 'center',
        padding: '0px',
        overflow: 'hidden', 
        textOverflow: 'ellipsis',
        textAlign: 'center', 
        top: '18%',
        height: '80%',
      }}>      
      <div style={{
        display: 'flex',
        flexDirection: 'row', 
        flexWrap: 'wrap', 
        width: '100%',
        maxWidth: '100%',
        justifyContent: 'center',
      }}>
        {[0, 1, 2].map(colIndex => (
          <div key={colIndex} style={{
            display: 'flex',
            flexDirection: 'column',
            width: '30%', 
            boxSizing: 'border-box',
            margin: '0 20px', 
          }}>
            {delegates
              .filter((_, index) => index % 3 === colIndex)
              .map((item, index) => (
                <div key={index} style={{
                  display: 'flex',
                  flexDirection: 'column', 
                  margin: '5px 0',
                  alignItems: 'center',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  color: colIndex === 1 ? '#E5383B' : '#36A4B4',
                  height: 'auto',
                }}>                    
                  {truncateMiddle(item.address, 11)}
                  <br/>
                  {item.count}
                </div>
              ))
            }
          </div>
        ))}
      </div>
    </div>
  </div>
  ),
  intents,
  });
  
})


app.frame('/randomRecommendation', async (c) => {
 /* const {  frameData } = c;
 const { fid } = frameData || {} */

 const fid = 192336


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
    image: `/Frame_8_no_followers.png`,
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
    background: '#f6f6f6',
    alignItems: 'center',
    position: 'relative',
  }}
> 
  <img width="1200" height="630" alt="background" src={`/Frame_7_random_delegates.png`} />
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      position: 'absolute',
      color: '#161B33',
      fontSize: '65px',
      textTransform: 'uppercase',
      letterSpacing: '-0.030em',
      width: '100%',
      boxSizing: 'border-box',
      alignItems: 'center',
      lineHeight: 0.8,
      padding: '0px',
      overflow: 'hidden', 
      textOverflow: 'ellipsis',
      textAlign: 'center', 
      top: '30%',
      height: '80%',
    }}>      
    <div style={{
      display: 'flex',
      flexDirection: 'row', 
      flexWrap: 'wrap', 
      width: '100%',
      maxWidth: '100%',
      justifyContent: 'center',
    }}>
      {[0, 1, 2].map(colIndex => (
        <div key={colIndex} style={{
          display: 'flex',
          flexDirection: 'column', 
          width: '30%', 
          boxSizing: 'border-box',
          margin: '0 20px', 
        }}>
          {delegates
            .filter((_, index) => index % 3 === colIndex) 
            .map((item, index) => (
              <div key={index} style={{
                display: 'flex',
                flexDirection: 'column',
                margin: '5px 0',
                alignItems: 'center',
                textOverflow: 'ellipsis',
                color: colIndex === 1 ? '#E5383B' : '#36A4B4',
                whiteSpace: 'nowrap',
                height: 'auto', 
              }}>                    
                {truncateMiddle(item.address, 11)}
              </div>
            ))
          }
        </div>
      ))}
    </div>
  </div>
</div>
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