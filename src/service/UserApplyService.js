const url = "https://server.sabisu.tech/nesaserver/user/apply"

async function getUserApplyData() {
    try {
        let response = await fetch(url);
        return response.json();
    } catch (error) {
        console.error(error);
    }
}

async function postUserApplyData(jsonBody) {
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: jsonBody,
    })
    return response;
}

export const UserApplyService = {
    getUserApplyData() {
        return getUserApplyData();
    },

    postUserApplyData(jsonBody) {
        return postUserApplyData(jsonBody);
    }
}