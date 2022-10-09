import axios from "axios";

export async function useLoader(params: {
    token: string
}) {

    const { token } = params


    for (let offset = 0; offset < 1000000; offset += 200) {
        const response = await axios.get(`https://api.vk.com/method/messages.getHistory`, {
            params: {
                access_token: token,
                user_id: 158928089,
                count: 200,
                offset,
                v: '5.131'
            }
        })

        const count = response?.data?.response?.count
        const items = response?.data?.response?.items

        if (count < offset) break;

        console.log(offset, items);
        console.log(response);
        await new Promise(resolve => setTimeout(resolve, 150));
        if (items == undefined) {
            offset -= 200;
        }

    }

    console.log("USE");


    // console.log('SEND POST: ', today);

}

