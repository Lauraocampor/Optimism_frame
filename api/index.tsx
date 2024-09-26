import * as dotenv from 'dotenv'
dotenv.config();

import { Button, Frog, FrameIntent} from 'frog'
import { neynar } from 'frog/hubs'
import { handle } from 'frog/vercel'
import { devtools } from 'frog/dev'
import { serveStatic } from 'frog/serve-static'

import { DelegatesResponseDTO } from './service/delegatesResponseDTO.js';
import { suggestedDelegates, suggestionResponseDTO } from './service/suggestionResponseDTO.js';
import { randomDelegates, randomResponseDTO } from './service/randomResponseDTO.js';


// Uncomment to use Edge Runtime.
// export const config = {
// runtime: 'edge',
// }

type State = {
  delegate: DelegatesResponseDTO,
  delegates: suggestionResponseDTO,
  delegatesRandom: randomDelegates[],
  fid: number
}

export const app = new Frog<{ State: State }>({
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
  },
  initialState: { 
    delegate: {
      hasVerifiedAddress: false,
      hasDelegate: false,
      isGoodDelegate: false,
      delegateInfo: {
        delegateAddress: '0x0000000000',
        warpcast: ''
      }
    },
    delegates: [],
    delegatesRandom: [],
    fid: 0
  }
})

/* API CALL GET_STATS */
export async function getStats(fid: number) : Promise<DelegatesResponseDTO>{
    
  const delegateApiURL = new URL(`${process.env.DELEGATE_API_URL}/get_stats`)

  delegateApiURL.searchParams.append('fid', fid.toString());

  const response = await fetch(delegateApiURL, {
      method: 'GET',
      headers: {
          'Content-Type': 'application/json'
      }
  })

  if (!response.ok){
    console.log(`Error get delegate info for fid ${fid}`)
  }
  let data : DelegatesResponseDTO = await response.json();
  return data
}

/* API CALL GET_SUGGESTED_DELEGATES */
export async function getSuggestedDelegates(fid: number): Promise<suggestionResponseDTO> {

  const delegateApiURL = new URL(`${process.env.DELEGATE_API_URL}/get_suggested_delegates`);

  delegateApiURL.searchParams.append('fid', fid.toString());

  const response = await fetch(delegateApiURL, {
      method: 'GET',
      headers: {
          'Content-Type': 'application/json'
      }
  })

  if (!response.ok){
    console.log(`Error getSuggestedDelegates for fid ${fid}`)
  }
  let data : suggestionResponseDTO = await response.json()
  return data
}

/* API CALL GET_RANDOM_DELEGATES */
export async function getRandomDelegates(fid: number): Promise<randomResponseDTO> {

  const delegateApiURL = new URL(`${process.env.DELEGATE_API_URL}/get_random_delegates`);

  delegateApiURL.searchParams.append('fid', fid.toString());

  const response = await fetch(delegateApiURL, {
      method: 'GET',
      headers: {
          'Content-Type': 'application/json'
      }
  })

  if (!response.ok){
    console.log(`Error getRandomDelegates for fid ${fid}`)
  }
  let data : randomResponseDTO = await response.json()
  return data
}

app.frame('/', async (c) => {
  const {  previousState} = c;
  
  /*VERIFIED FID - REMEMBER TO ADD FRAMEDATA ON THE CONTEXT => const {  previousState, frameData } = c; */
  //const { fid } = frameData || {}
  
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

  previousState.fid = fid

  getStats(fid).then((data) => {
    previousState.delegate = data;
  });
  
  if(previousState.delegates.length === 0){
      getSuggestedDelegates(fid).then((data) => {
      previousState.delegates = data;
    });
  }

  if(previousState.delegatesRandom.length === 0){
    getRandomDelegates(fid).then((data) => {
      previousState.delegatesRandom = data;
    });
  }

  return c.res({
    image: `/Frame_1_start_op.png`,
    imageAspectRatio: '1.91:1',
    intents: [
      <Button action="/delegatesStats">View Stats</Button>
    ],
  })
})

/* ADDRESS AND USERNAME FUNCTIONS */
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
const {  previousState } = c;

/*  const fid = previousState.fid

 if (typeof fid !== 'number' || fid === null){
    return c.res({
      image: `/Frame_6_error.png`,
      imageAspectRatio: '1.91:1',
      intents: [
        <Button.Reset>Try again</Button.Reset>,
      ],
    })
  } */

  const delegate = previousState.delegate;

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
      image: `/Frame_5_no delegate_explore.png`,
      imageAspectRatio: '1.91:1',
      intents: [
        <Button action='/socialRecommendation'>Social Graph</Button>,
        <Button action='/randomRecommendation'>Random</Button>,
        <Button.Reset>Reset</Button.Reset>,
      ],
    })
  }

  const userDelegate = delegate.delegateInfo.warpcast
  const addressDelegate = truncateMiddle(delegate.delegateInfo.delegateAddress, 11)

  const delegateData = (userDelegate !== null && userDelegate !== '') ? userDelegate : addressDelegate;


  /* TEST BAD DELEGATE FRAME */
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
              alignItems: 'flex-end',
              position: 'relative',
              overflow: 'hidden'
          }}>
              <img width="1200" height="630" alt="background" src={`/Frame_2.1_bad_delegate_stats_dynamic.png`} style={{position: 'absolute', width: '100%', height: '100%', objectFit: 'cover'}} />
              
              <div
                  style={{
                      display: 'flex',
                      flexDirection: 'column',
                      position: 'absolute',
                      color: '#161B33',
                      fontSize: '75px',
                      textTransform: 'uppercase',
                      letterSpacing: '-0.035em',
                      width: '90%',
                      padding: '10px',
                      top: '6%',
                      height: '30%',
                      overflow: 'hidden',
                      lineHeight: 0.6,
                      textAlign: 'right',
                      transform: 'translateX(-60px)'
                  }}
              >
                  <div style={{
                      display: 'flex',
                      justifyContent: 'center',
                      width: '100%',
                      flexWrap: 'wrap'
                  }}>
                      <div style={{ marginRight: '10px' }}>Did</div>
                      <div style={{display: 'flex', color: '#E5383B', margin: '0 10px' }}>{delegateData}</div>
                      <div style={{ marginLeft: '10px' }}>vote</div>
                      <div style={{ marginLeft: '10px' }}>in</div>
                      <div style={{ marginLeft: '10px' }}>the</div>
                      <div style={{ marginLeft: '10px' }}>most</div>
                      <div style={{ marginLeft: '10px' }}>recent</div>
                      <div style={{ marginLeft: '10px' }}>proposal?</div>
                  </div>
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
            alignItems: 'flex-end',
            position: 'relative',
            overflow: 'hidden'
        }}>
            <img width="1200" height="630" alt="background" src={`/Frame_2_stats_dynamic.png`} style={{position: 'absolute', width: '100%', height: '100%', objectFit: 'cover'}} />
            
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'absolute',
                    color: '#161B33',
                    fontSize: '75px',
                    textTransform: 'uppercase',
                    letterSpacing: '-0.035em',
                    width: '90%',
                    padding: '10px',
                    top: '6%',
                    height: '30%',
                    overflow: 'hidden',
                    lineHeight: 0.6,
                    textAlign: 'right',
                    transform: 'translateX(-60px)'
                }}
            >
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    width: '100%',
                    flexWrap: 'wrap'
                }}>
                    <div style={{ marginRight: '10px' }}>Did</div>
                    <div style={{display: 'flex', color: '#E5383B', margin: '0 10px' }}>{delegateData}</div>
                    <div style={{ marginLeft: '10px' }}>vote</div>
                    <div style={{ marginLeft: '10px' }}>in</div>
                    <div style={{ marginLeft: '10px' }}>the</div>
                    <div style={{ marginLeft: '10px' }}>most</div>
                    <div style={{ marginLeft: '10px' }}>recent</div>
                    <div style={{ marginLeft: '10px' }}>proposal?</div>
                </div>
            </div>
        </div>
      ),
        intents: [
          <Button.Link href='https://warpcast.com/~/compose?text=Hello%20world!&embeds[]=https://test-frame-nu.vercel.app/api/delegatesStats'>Share</Button.Link>,
          <Button.Reset>Reset</Button.Reset>
        ],
      })

})

/* BUTTON FUNCTIONS */
function getOrdinalSuffix(index: number): string {
  const suffixes = ["th", "st", "nd", "rd"];
  const value = index % 100;
  return suffixes[(value - 20) % 10] || suffixes[value] || suffixes[0];
}

function getIntentsSuggested(delegates: suggestedDelegates[]) : FrameIntent[]{
  return delegates.map((delegate: suggestedDelegates, index: number) => {
    const position = index+1
    return <Button.Link href={`https://vote.optimism.io/delegates/${delegate.address}`}>{`${position}${getOrdinalSuffix(position)} Delegate`}</Button.Link>
  })
}

function getIntentsRandom(delegates: randomDelegates[]) : FrameIntent[]{
  return delegates.map((delegate: randomDelegates, index: number) => {
    const position = index+1
    return <Button.Link href={`https://vote.optimism.io/delegates/${delegate.address}`}>{`${position}${getOrdinalSuffix(position)} Delegate`}</Button.Link>
  })
}

app.frame('/socialRecommendation', async (c) => {
  const {  previousState } = c;

/*   const fid = previousState.fid;  
  
  if (typeof fid !== 'number' || fid === null) {
    return c.res({
      image: `/Frame_6_error.png`,
      imageAspectRatio: '1.91:1',
      intents: [<Button.Reset>Try again</Button.Reset>],
    });
  } */
  
  const delegates = previousState.delegates;
  
  /* TEST FRAMES */
  //delegates.length = 0

  if (delegates.length === 0) {
    const delegates = previousState.delegatesRandom;
    
    const intents = getIntentsRandom(delegates);
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
      <img width="1200" height="630" alt="background" src={`/Frame_8_no_followers.png`} />
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
                    { item.username === 'no_farcaster_name' ? truncateMiddle(item.address, 11) :  truncateWord(item.username, 12)}
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
  
  const intents = getIntentsSuggested(delegates);
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
            { item.username === 'no_farcaster_name' ? truncateMiddle(item.address, 11) :  truncateWord(item.username, 12)}
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
                  { item.username === 'no_farcaster_name' ? truncateMiddle(item.address, 11) :  truncateWord(item.username, 12)}
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
                  { item.username === 'no_farcaster_name' ? truncateMiddle(item.address, 11) :  truncateWord(item.username, 12)}
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
const {  previousState } = c;

/* const fid = previousState.fid;


if (typeof fid !== 'number' || fid === null) {
  return c.res({
    image: `/Frame_6_error.png`,
    imageAspectRatio: '1.91:1',
    intents: [<Button.Reset>Try again</Button.Reset>],
  });
} */

const delegates = previousState.delegatesRandom;

const intents = getIntentsRandom(delegates);
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
                { item.username === 'no_farcaster_name' ? truncateMiddle(item.address, 11) :  truncateWord(item.username, 12)}
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