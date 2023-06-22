import axios from "axios";

export const getProfileData = async (accessToken: string) => {
    const { data: { names: [{ displayName }], photos: [{ url }] } } = await axios.get('https://people.googleapis.com/v1/people/me', {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
        params: {
            access_token: accessToken,
            personFields: 'names,photos',
        },
    });

    return { name: displayName, photo: url }
}